import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { getLineColor } from './LineRoundels';

const RoutePolylines = ({ routeSequenceData }) => {
  const uniqueSegments = useMemo(() => {
    const segmentMap = new Map();

    routeSequenceData.forEach((route) => {
      route.LineStrings.forEach((lineString) => {
        const coordinates = JSON.parse(lineString)[0].map(coord => [coord[1], coord[0]]);
        
        for (let i = 0; i < coordinates.length - 1; i++) {
          const segment = [coordinates[i], coordinates[i + 1]].sort((a, b) => {
            return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
          });
          const key = `${route.LineId}-${segment[0].join(',')}-${segment[1].join(',')}`;
          
          if (!segmentMap.has(key)) {
            segmentMap.set(key, {
              coordinates: segment,
              lineId: route.LineId,
              direction: route.Direction
            });
          }
        }
      });
    });

    return Array.from(segmentMap.values());
  }, [routeSequenceData]);

  return (
    <>
      {uniqueSegments.map((segment, index) => (
        <Polyline
          key={`${segment.lineId}-${segment.direction}-${index}`}
          positions={segment.coordinates}
          color={getLineColor(segment.lineId)}
          weight={10}
          opacity={0.5}
        />
      ))}
    </>
  );
};

export default RoutePolylines;
