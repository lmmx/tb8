import React from 'react';
import { Polyline } from 'react-leaflet';
import { getLineColor } from './LineRoundels';

const RoutePolylines = ({ routeSequenceData }) => {
  console.log('Rendering route polylines:', routeSequenceData);
  return (
    <>
      {routeSequenceData.map((route, routeIndex) => (
        route.LineStrings.map((lineString, lineStringIndex) => {
          const coordinates = JSON.parse(lineString)[0].map(coord => [coord[1], coord[0]]);
          console.log("Plotting coordinates:", coordinates, "from:", route);
          return (
            <Polyline
              key={`${route.LineId}-${route.Direction}-${routeIndex}-${lineStringIndex}`}
              positions={coordinates}
              color={getLineColor(route.LineId)}
              weight={10}
              opacity={1}
            />
          );
        })
      ))}
    </>
  );
};


export default RoutePolylines;
