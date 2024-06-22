import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_BASE_URL = 'https://tb8.onrender.com';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// London coordinates as default center
const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 10;

function MapContent({ points }) {
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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {points && points.map((point) => (
        <Marker key={point.UniqueId} position={[point.Lat, point.Lon]}>
          <Popup>
            <strong>{point.StationName}</strong><br />
            Area: {point.AreaName}<br />
            Level: {point.Level}<br />
            Fare Zones: {point.FareZones}<br />
            WiFi: {point.Wifi ? 'Available' : 'Not Available'}
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function StationPointsExplorer() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [points, setPoints] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStationList();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchStationPoints();
    } else {
      setPoints(null);
    }
  }, [selectedStation]);

  useEffect(() => {
    // Apply the z-index fix to the leaflet container
    const leafletContainer = document.querySelector('.leaflet-container');
    if (leafletContainer) {
      leafletContainer.style.zIndex = '-1';
    }
  }, []);

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
      const query = `SELECT * FROM self WHERE StationName = '${selectedStation.value}';`;
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

  const handleStationSelect = (selectedOption) => {
    setSelectedStation(selectedOption);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Station Points Explorer</h1>
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
      <div className="mt-4">
        <h2 className="text-2xl font-bold mb-2">Map:</h2>
        <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '400px', width: '100%' }}>
          <MapContent points={points} />
        </MapContainer>
      </div>
    </div>
  );
}
