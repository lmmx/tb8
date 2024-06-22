import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import L from 'leaflet';

const API_BASE_URL = 'https://tb8.onrender.com';

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

const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 10;

function MapContent({ journey, centroids }) {
  const map = useMap();

  useEffect(() => {
    if (journey && journey.stations.length > 0) {
      const bounds = L.latLngBounds(journey.stations.map(station => [station.lat, station.lon]));
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
      {journey && journey.stations.map((station) => {
        const lowestZone = getLowestFareZone(station.fareZones);
        const color = getFareZoneColor(lowestZone);
        return (
          <Marker key={station.id} position={[station.lat, station.lon]} icon={createStationIcon(color)}>
            <Popup>
              <div className="custom-popup">
                <h3 className="font-bold">{station.name}</h3>
                <p>Area: {station.area}</p>
                <p>Level: {station.level}</p>
                <p>Fare Zones: {station.fareZones}</p>
                <p>WiFi: {station.wifi ? 'Available' : 'Not Available'}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {centroids && centroids.map((centroid) => {
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

// API functions
const fetchStations = async () => {
  const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent('SELECT DISTINCT StationName FROM self ORDER BY StationName;')}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.results.map(station => ({ 
    value: station.StationName, 
    label: station.StationName 
  }));
};

const fetchJourneyData = async (stationNames) => {
  const names = stationNames.map(name => `'${name.replace("'", "''")}'`).join(', ');
  const query = `SELECT * FROM self WHERE StationName IN (${names});`;
  const response = await fetch(`${API_BASE_URL}/station-points?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.results.filter(point => 
    typeof point.Lat === 'number' && 
    typeof point.Lon === 'number' &&
    !isNaN(point.Lat) && 
    !isNaN(point.Lon)
  ).map(point => ({
    id: point.UniqueId,
    name: point.StationName,
    lat: point.Lat,
    lon: point.Lon,
    area: point.AreaName,
    level: point.Level,
    fareZones: point.FareZones,
    wifi: point.Wifi
  }));
};

const fetchCentroids = async () => {
  const query = 'SELECT DISTINCT ON (StationUniqueId) * FROM self;';
  const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.results.filter(centroid => 
    typeof centroid.Lat === 'number' && 
    typeof centroid.Lon === 'number' &&
    !isNaN(centroid.Lat) && 
    !isNaN(centroid.Lon)
  ).map(centroid => ({
    id: centroid.StationUniqueId,
    name: centroid.StationName,
    lat: centroid.Lat,
    lon: centroid.Lon,
    fareZones: centroid.FareZones,
    wifi: centroid.Wifi
  }));
};

const calculateJourneyPath = (stations) => {
  return stations.map(station => [station.lat, station.lon]);
};

export default function JourneyPlanner() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [journey, setJourney] = useState(null);
  const [centroids, setCentroids] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [stationList, centroidData] = await Promise.all([fetchStations(), fetchCentroids()]);
        setStationOptions(stationList);
        setCentroids(centroidData);
      } catch (err) {
        setError("Failed to initialize data: " + err.message);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    const updateJourney = async () => {
      if (selectedStations.length > 0) {
        setLoading(true);
        setError(null);
        try {
          const stationNames = selectedStations.map(station => station.value);
          const journeyData = await fetchJourneyData(stationNames);
          const journeyPath = calculateJourneyPath(journeyData);
          setJourney({
            stations: journeyData,
            path: journeyPath
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setJourney(null);
      }
    };
    updateJourney();
  }, [selectedStations]);

  const handleStationSelect = (selectedOptions) => {
    setSelectedStations(selectedOptions || []);
  };

  // This function represents how an API might return the journey data
  const getJourneyData = () => {
    if (!journey) return null;
    return {
      stations: journey.stations,
      path: journey.path,
      totalStations: journey.stations.length,
      totalDistance: calculateTotalDistance(journey.path),
      fareZones: calculateFareZones(journey.stations)
    };
  };

  // Helper function to calculate total distance (simplified)
  const calculateTotalDistance = (path) => {
    // This is a simplified calculation. In a real app, you'd use a more sophisticated method.
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i][0] - path[i-1][0];
      const dy = path[i][1] - path[i-1][1];
      total += Math.sqrt(dx*dx + dy*dy);
    }
    return total.toFixed(2);
  };

  // Helper function to calculate fare zones
  const calculateFareZones = (stations) => {
    const zones = new Set();
    stations.forEach(station => {
      station.fareZones.split('|').forEach(zone => zones.add(parseInt(zone)));
    });
    return Array.from(zones).sort((a, b) => a - b);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
      <div className="container mx-auto max-w-6xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800 border-b-2 border-gray-200 pb-4">
          London Transport Journey Planner
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md" style={{ height: '600px' }}>
              <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                <MapContent journey={journey} centroids={centroids} />
              </MapContainer>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-gray-50 rounded-lg p-4 shadow-md mb-6">
              <div className="mb-4">
                <label htmlFor="station-select" className="block mb-2 font-medium text-gray-600">
                  Select Stations for Your Journey:
                </label>
                <Select
                  id="station-select"
                  options={stationOptions}
                  value={selectedStations}
                  onChange={handleStationSelect}
                  placeholder="Type to search for stations..."
                  isMulti
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
              {journey && (
                <div className="mt-4 bg-white p-4 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">Journey Summary</h3>
                  <p>Total Stations: {journey.stations.length}</p>
                  <p>Total Distance: {calculateTotalDistance(journey.path)} units</p>
                  <p>Fare Zones: {calculateFareZones(journey.stations).join(', ')}</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">Legend</h3>
              <div className="flex mb-3">
                <div className="flex items-center w-1/2">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
                    <circle cx="12" cy="12" r="10" fill="black" />
                    <circle cx="12" cy="12" r="8" fill="white" />
                  </svg>
                  <span className="text-sm text-gray-600">Station Point</span>
                </div>
                <div className="flex items-center w-1/2">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
                    <circle cx="12" cy="12" r="10" fill="black" />
                    <circle cx="12" cy="12" r="8" fill="white" />
                    <circle cx="12" cy="12" r="3" fill="black" />
                  </svg>
                  <span className="text-sm text-gray-600">Station Centroid</span>
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map(zone => (
                  <div key={zone} className="flex items-center bg-white p-2 rounded shadow">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
                      <circle cx="12" cy="12" r="10" fill="black" />
                      <circle cx="12" cy="12" r="8" fill={getFareZoneColor(zone)} />
                    </svg>
                    <span className="text-sm text-gray-600">Zone {zone}{zone === 7 ? '+' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-600">
        <p>© 2024 Louis Maddox : : <a href="https://spin.systems">spin.systems</a></p>
      </footer>
    </div>
  );
}
