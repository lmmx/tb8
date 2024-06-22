import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API_BASE_URL = 'https://tb8.onrender.com';

const endpoints = [
  { value: '/lines', label: 'Lines' },
  { value: '/lines-by-station', label: 'Lines by Station' },
  { value: '/stations', label: 'Stations' },
  { value: '/station-points', label: 'Station Points' },
];

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

export default function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/station-points');
  const [query, setQuery] = useState('SELECT * FROM self;');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch(`${API_BASE_URL}${selectedEndpoint}?query=${encodeURIComponent(query)}`);
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
    if (selectedEndpoint !== '/station-points' || !results || !results.results || results.results.length === 0) {
      return null;
    }

    const validPoints = results.results.filter(point => 
      typeof point.Lat === 'number' && 
      typeof point.Lon === 'number' &&
      !isNaN(point.Lat) && 
      !isNaN(point.Lon)
    );

    if (validPoints.length === 0) {
      return <p>No valid coordinates found in the data.</p>;
    }

    const center = [validPoints[0].Lat, validPoints[0].Lon];

    return (
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Map:</h2>
        <MapContainer center={center} zoom={11} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {validPoints.map((point) => (
            <Marker key={point.UniqueId} position={[point.Lat, point.Lon]}>
              <Popup>
                <strong>{point.FriendlyName}</strong><br />
                Area: {point.AreaName}<br />
                Level: {point.Level}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-2">Results:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">API Explorer</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="endpoint" className="block mb-2 font-semibold">
            Endpoint:
          </label>
          <select
            id="endpoint"
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {endpoints.map((endpoint) => (
              <option key={endpoint.value} value={endpoint.value}>
                {endpoint.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="query" className="block mb-2 font-semibold">
            SQL Query:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {renderMap()}
      {renderResults()}
    </div>
  );
}
