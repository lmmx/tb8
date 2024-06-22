import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import L from 'leaflet';

const API_BASE_URL = 'https://tb8.onrender.com';

// Custom icon
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
      />
      {points && points.map((point) => (
        <Marker key={point.UniqueId} position={[point.Lat, point.Lon]} icon={customIcon}>
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
      <FullscreenControl />
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

  const handleStationSelect = (selectedOption) => {
    setSelectedStation(selectedOption);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">Station Points Explorer</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <MapContent points={points} />
            </MapContainer>
          </div>
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <h3 className="font-bold">Legend:</h3>
            <div className="flex items-center">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" alt="Station Marker" className="h-6 mr-2" />
              <span>Station Point</span>
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
