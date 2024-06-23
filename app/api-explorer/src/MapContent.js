import React, { useEffect } from 'react';
import { TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';

const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 10;

// Updated color mapping function based on fare zone
const getFareZoneColor = (fareZone) => {
    const zoneColors = {
        1: '#FFFFFF', // White
        2: '#00A693', // Sea Green
        3: '#FFD900', // Mellow Yellow
        4: '#FF9900', // Mellow Orange
        5: '#AE84DD', // Pastel Purple
        6: '#EC7D91', // Baby Pink
        7: '#6f6f6f', // Pale White/Grey
        8: '#6f6f6f', // Pale White/Grey
        9: '#6f6f6f'  // Pale White/Grey
    };
    return zoneColors[fareZone] || '#6f6f6f'; // Default to Pale White/Grey for unknown zones
};

// Parse fare zone and get the lowest numerical zone
const getLowestFareZone = (fareZones) => {
    if (!fareZones) return 7; // Default to 7 if no fare zone info
    const zones = fareZones.split('|').map(zone => parseInt(zone)).filter(zone => !isNaN(zone));
    return zones.length > 0 ? Math.min(...zones) : 7;
};

// Create a custom tube-style icon for stations
const createStationIcon = (color, size = 24) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="black" />
      <circle cx="12" cy="12" r="8" fill="${color}" />
    </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-station-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};

// Create a custom tube-style icon for centroids (slightly smaller)
const createCentroidIcon = (color, size = 20) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="black" />
      <circle cx="12" cy="12" r="8" fill="${color}" />
      <circle cx="12" cy="12" r="3" fill="black" />
    </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-centroid-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};

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
                  <p>Fare Zones: {point.fareZones}</p>
                  <p>WiFi: {point.wifi ? 'Available' : 'Not Available'}</p>
                  {station.centroid.platforms && station.centroid.platforms.length > 0 && (
                    <div>
                      <h4 className="font-semibold mt-2">Platforms:</h4>
                      <ul className="list-disc pl-5">
                        {station.centroid.platforms.map(platform => (
                          <li key={platform.PlatformUniqueId}>
                            {platform.PlatformFriendlyName || platform.PlatformNumber} 
                            {platform.CardinalDirection && ` (${platform.CardinalDirection})`}
                            {platform.Line && ` - ${platform.Line}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                <p>Fare Zones: {centroid.fareZones}</p>
                <p>WiFi: {centroid.wifi ? 'Available' : 'Not Available'}</p>
                {centroid.platforms && centroid.platforms.length > 0 && (
                  <div>
                    <h4 className="font-semibold mt-2">Platforms:</h4>
                    <ul className="list-disc pl-5">
                      {centroid.platforms.map(platform => (
                        <li key={platform.PlatformUniqueId}>
                          {platform.PlatformFriendlyName || platform.PlatformNumber} 
                          {platform.CardinalDirection && ` (${platform.CardinalDirection})`}
                          {platform.Line && ` - ${platform.Line}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

export { DEFAULT_CENTER, DEFAULT_ZOOM, getFareZoneColor, MapContent };
