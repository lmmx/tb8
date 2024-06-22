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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
      <div className="container mx-auto max-w-6xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800 border-b-2 border-gray-200 pb-4">
          London Transport Network Explorer
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md" style={{ height: '600px' }}>
              <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                <MapContent points={points} centroids={centroids} />
              </MapContainer>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-md">
              <h3 className="font-bold text-lg mb-2 text-gray-700">Legend:</h3>
              <div className="flex items-center mb-2">
                <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" alt="Station Marker" className="h-6 mr-2" />
                <span className="text-gray-600">Station Point</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(zone => (
                  <div key={zone} className="flex items-center bg-white p-2 rounded shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={getFareZoneColor(zone)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span className="text-sm text-gray-600">Zone {zone}{zone === 7 ? '+' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 rounded-lg p-4 shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Station Selector</h2>
              <div className="mb-4">
                <label htmlFor="station-select" className="block mb-2 font-medium text-gray-600">
                  Select a Station:
                </label>
                <Select
                  id="station-select"
                  options={stationOptions}
                  value={selectedStation}
                  onChange={handleStationSelect}
                  placeholder="Type to search for a station..."
                  isClearable
                  className="text-gray-700"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e0' }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected ? '#4299e1' : state.isFocused ? '#ebf8ff' : null,
                      color: state.isSelected ? 'white' : '#4a5568'
                    })
                  }}
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center p-4 bg-blue-100 rounded">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-blue-600">Loading...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4" role="alert">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              {selectedStation && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">Selected Station</h3>
                  <p className="text-gray-600">{selectedStation.label}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-600">
        <p>© 2024 London Transport Network Explorer. All rights reserved.</p>
      </footer>
    </div>
  );
}
