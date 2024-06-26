
import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { getLineColor } from './LineRoundels';

const OFFSET_FACTOR = 0.0004; // As requested

const RoutePolylines = ({ routeSequenceData }) => {
  const lineSegments = useMemo(() => {
    const segmentMap = new Map();
    const lineIndices = new Map();

    routeSequenceData.forEach((route, index) => {
      lineIndices.set(route.LineId, index);
      
      route.LineStrings.forEach((lineString) => {
        const coordinates = JSON.parse(lineString)[0].map(coord => [coord[1], coord[0]]);
        
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

    const offsetSegments = new Map();
    segmentMap.forEach((segments) => {
      segments.forEach((segment, idx) => {
        const offset = idx * OFFSET_FACTOR;
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

  return (
    <>
      {lineSegments.map(([lineId, coordinates]) => (
        <Polyline
          key={lineId}
          positions={coordinates}
          color={getLineColor(lineId)}
          weight={10}
          opacity={0.8}
        />
      ))}
    </>
  );
};

export default RoutePolylines;
