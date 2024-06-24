import React, { useEffect } from 'react';
import { TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import L from 'leaflet';
import { renderLineRoundels } from './LineRoundels';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import { getLowestFareZone, getFareZoneColor, createStationIcon, createCentroidIcon } from '../utils/mapUtils';

const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 10;

function MapContent({ journey, allCentroids }) {
  const map = useMap();

  useEffect(() => {
    if (journey && journey.stations.length > 0) {
      const bounds = L.latLngBounds(journey.stations.map(station => [station.centroid.lat, station.centroid.lon]));
      map.fitBounds(bounds);
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [journey, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
      />
      {journey && journey.stations.flatMap(station => 
        station.points.map(point => {
          const lowestZone = getLowestFareZone(point.fareZones);
          const color = getFareZoneColor(lowestZone);
          return (
            <Marker key={point.id} position={[point.lat, point.lon]} icon={createStationIcon(color)}>
              <Popup>
                <div className="custom-popup">
                  <h3 className="font-bold">{station.name}</h3>
                  <p>Area: {point.area}</p>
                  <p>Level: {point.level}</p>
                  <p>Zones: {point.fareZones}</p>
                  <p>WiFi: {point.wifi ? 'Available' : 'Not Available'}</p>
		  {renderLineRoundels(station.centroid.platforms.platforms)}
                </div>
              </Popup>
            </Marker>
          );
        })
      )}
      {allCentroids && Object.values(allCentroids).map((centroid) => {
        const lowestZone = getLowestFareZone(centroid.fareZones);
        const color = getFareZoneColor(lowestZone);
        return (
          <Marker 
            key={`centroid-${centroid.id}`} 
            position={[centroid.lat, centroid.lon]} 
            icon={createCentroidIcon(color)}
          >
            <Popup>
              <div className="custom-popup">
                <h3 className="font-bold">{centroid.name}</h3>
                <p>Zones: {centroid.fareZones}</p>
                <p>WiFi: {centroid.wifi ? 'Available' : 'Not Available'}</p>
		{renderLineRoundels(centroid.platforms.platforms)}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {journey && journey.path && (
        <Polyline 
          positions={journey.path} 
          color="blue" 
          weight={3} 
          opacity={0.7} 
          smoothFactor={1}
        />
      )}
      <FullscreenControl />
    </>
  );
}

export default MapContent;
export { DEFAULT_CENTER, DEFAULT_ZOOM, getFareZoneColor };
