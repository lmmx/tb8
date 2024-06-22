import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function StationPointsExplorer() {
  const [stationList, setStationList] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStationList();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchStationPoints();
    }
  }, [selectedStation]);

  const fetchStationList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent('SELECT DISTINCT StationName FROM self ORDER BY StationName;')}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStationList(data.results.map(station => station.StationName));
    } catch (err) {
      setError("Failed to fetch station list: " + err.message);
    }
  };

  const fetchStationPoints = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const query = `SELECT * FROM self WHERE StationName = '${selectedStation}';`;
      const response = await fetch(`${API_BASE_URL}/station-points?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMap = () => {
    if (!results || !results.results || results.results.length === 0) {
      return null;
    }

    const validPoints = results.results.filter(point => 
      typeof point.Lat === 'number' && 
      typeof point.Lon === 'number' &&
      !isNaN(point.Lat) && 
      !isNaN(point.Lon)
    );

    if (validPoints.length === 0) {
      return <p>No valid coordinates found for this station.</p>;
    }

    const center = [validPoints[0].Lat, validPoints[0].Lon];

    return (
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Map:</h2>
        <MapContainer center={center} zoom={15} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {validPoints.map((point) => (
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
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Station Points Explorer</h1>
      <div className="mb-4">
        <label htmlFor="station" className="block mb-2 font-semibold">
          Select a Station:
        </label>
        <select
          id="station"
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a station...</option>
          {stationList.map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {renderMap()}
      {results && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
