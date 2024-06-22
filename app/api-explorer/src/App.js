import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import L from 'leaflet';

const API_BASE_URL = 'https://tb8.onrender.com';

// Custom icons
const stationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

// Create a custom cross icon for centroids
const createCrossIcon = (color, size = 20) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-cross-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};

const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 10;

function MapContent({ points, centroids }) {
  const map = useMap();

  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points.map(point => [point.Lat, point.Lon]));
      map.fitBounds(bounds);
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [points, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
      />
      {points && points.map((point) => (
        <Marker key={point.UniqueId} position={[point.Lat, point.Lon]} icon={stationIcon}>
          <Popup>
            <div className="custom-popup">
              <h3 className="font-bold">{point.StationName}</h3>
              <p>Area: {point.AreaName}</p>
              <p>Level: {point.Level}</p>
              <p>Fare Zones: {point.FareZones}</p>
              <p>WiFi: {point.Wifi ? 'Available' : 'Not Available'}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {centroids && centroids.map((centroid) => {
        const lowestZone = getLowestFareZone(centroid.FareZones);
        const color = getFareZoneColor(lowestZone);
        return (
          <Marker 
            key={`centroid-${centroid.StationUniqueId}`} 
            position={[centroid.Lat, centroid.Lon]} 
            icon={createCrossIcon(color, 24)}
          >
            <Popup>
              <div className="custom-popup">
                <h3 className="font-bold">{centroid.StationName} (Centroid)</h3>
                <p>Fare Zones: {centroid.FareZones}</p>
                <p>WiFi: {centroid.Wifi ? 'Available' : 'Not Available'}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
      <FullscreenControl />
    </>
  );
}

export default function StationPointsExplorer() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [points, setPoints] = useState(null);
  const [centroids, setCentroids] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStationList();
    fetchAllCentroids();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchStationPoints();
    } else {
      setPoints(null);
    }
  }, [selectedStation]);

  const fetchStationList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent('SELECT DISTINCT StationName FROM self ORDER BY StationName;')}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStationOptions(data.results.map(station => ({ 
        value: station.StationName, 
        label: station.StationName 
      })));
    } catch (err) {
      setError("Failed to fetch station list: " + err.message);
    }
  };

  const fetchStationPoints = async () => {
    setLoading(true);
    setError(null);
    setPoints(null);
    try {
      const query = `SELECT * FROM self WHERE StationName = '${selectedStation.value.replace("'", "''")}';`;
      const response = await fetch(`${API_BASE_URL}/station-points?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPoints(data.results.filter(point => 
        typeof point.Lat === 'number' && 
        typeof point.Lon === 'number' &&
        !isNaN(point.Lat) && 
        !isNaN(point.Lon)
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCentroids = async () => {
    try {
      const query = 'SELECT DISTINCT ON (StationUniqueId) * FROM self;';
      const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCentroids(data.results.filter(centroid => 
        typeof centroid.Lat === 'number' && 
        typeof centroid.Lon === 'number' &&
        !isNaN(centroid.Lat) && 
        !isNaN(centroid.Lon)
      ));
    } catch (err) {
      setError("Failed to fetch centroids: " + err.message);
    }
  };

  const handleStationSelect = (selectedOption) => {
    setSelectedStation(selectedOption);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">London Transport Network Station Points Explorer</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <MapContent points={points} centroids={centroids} />
            </MapContainer>
          </div>
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <h3 className="font-bold">Legend:</h3>
            <div className="flex items-center">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" alt="Station Marker" className="h-6 mr-2" />
              <span>Station Point</span>
            </div>
            <div className="flex flex-wrap items-center mt-1">
              {[1, 2, 3, 4, 5, 6, 7].map(zone => (
                <div key={zone} className="flex items-center mr-4 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={getFareZoneColor(zone)} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="mr-1">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Zone {zone}{zone === 7 ? '+' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3">
          <div className="mb-4">
            <label htmlFor="station-select" className="block mb-2 font-semibold">
              Select a Station:
            </label>
            <Select
              id="station-select"
              options={stationOptions}
              value={selectedStation}
              onChange={handleStationSelect}
              placeholder="Type to search for a station..."
              isClearable
            />
          </div>
          {loading && <p>Loading...</p>}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {selectedStation && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-2">Selected Station:</h2>
              <p>{selectedStation.label}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
