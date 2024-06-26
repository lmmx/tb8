import React, { useMemo, useState, useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { getLineColor } from './LineRoundels';

const OFFSET_FACTOR = 0.0002;
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;
const MIN_WIDTH = 1;
const MAX_WIDTH = 12;

const RoutePolylines = ({ routeSequenceData }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  const lineSegments = useMemo(() => {
    const segmentMap = new Map();
    const stationLineCount = new Map();
    const lineIndices = new Map();

    // First pass: count lines at each station and create initial segment map
    routeSequenceData.forEach((route, index) => {
      lineIndices.set(route.LineId, index);

      route.LineStrings.forEach((lineString) => {
        const coordinates = JSON.parse(lineString)[0].map(coord => [coord[1], coord[0]]);

        coordinates.forEach(coord => {
          const stationKey = coord.join(',');
          if (!stationLineCount.has(stationKey)) {
            stationLineCount.set(stationKey, new Set());
          }
          stationLineCount.get(stationKey).add(route.LineId);
        });

        for (let i = 0; i < coordinates.length - 1; i++) {
          const segment = [coordinates[i], coordinates[i + 1]].sort((a, b) => {
            return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
          });
          const baseKey = `${segment[0].join(',')}-${segment[1].join(',')}`;

          if (!segmentMap.has(baseKey)) {
            segmentMap.set(baseKey, []);
          }

          const existingSegment = segmentMap.get(baseKey).find(s => s.lineId === route.LineId);
          if (!existingSegment) {
            segmentMap.get(baseKey).push({
              coordinates: segment,
              lineId: route.LineId,
              direction: route.Direction,
              index: lineIndices.get(route.LineId)
            });
          }
        }
      });
    });

    // Second pass: apply consistent offsets
    const offsetSegments = new Map();
    const sortedLineIds = Array.from(lineIndices.keys()).sort();

    segmentMap.forEach((segments, baseKey) => {
      const [start, end] = baseKey.split('-').map(coord => coord.split(',').map(Number));
      const startLineCount = stationLineCount.get(start.join(',')) || new Set();
      const endLineCount = stationLineCount.get(end.join(',')) || new Set();
      const maxLineCount = Math.max(startLineCount.size, endLineCount.size);

      segments.forEach((segment) => {
        const lineIndex = sortedLineIds.indexOf(segment.lineId);
        const offset = lineIndex * OFFSET_FACTOR;

        const offsetCoordinates = segment.coordinates.map(coord => [
          coord[0] + offset,
          coord[1]
        ]);

        if (!offsetSegments.has(segment.lineId)) {
          offsetSegments.set(segment.lineId, []);
        }
        offsetSegments.get(segment.lineId).push(offsetCoordinates);
      });
    });

    return Array.from(offsetSegments.entries());
  }, [routeSequenceData]);

  const getLineWidth = (zoom) => {
    const normalizedZoom = Math.max(0, Math.min(1, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)));
    const width = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * Math.pow(normalizedZoom, 1.5);
    const roundedWidth = Math.round(width * 10) / 10; // Round to 1 decimal place
    // console.log(`zoomed to ${zoom}, normed: ${normalizedZoom.toFixed(6)}, width: ${roundedWidth}`);
    return roundedWidth;
  };

  const currentLineWidth = getLineWidth(zoom);

  return (
    <>
      {lineSegments.map(([lineId, coordinates]) => (
        <Polyline
          key={`${lineId}-${zoom}`}
          positions={coordinates}
          color={getLineColor(lineId)}
          weight={currentLineWidth}
          opacity={0.8}
        />
      ))}
    </>
  );
};

export default RoutePolylines;
