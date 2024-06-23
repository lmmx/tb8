import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import Select from 'react-select';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import L from 'leaflet';
import { Bug, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getFareZoneColor, DEFAULT_CENTER, DEFAULT_ZOOM, MapContent } from './MapContent';
import { fetchStations, fetchJourneyData, fetchCentroids, fetchTubeDisruptions, fetchPlatformData } from './api_functions';

// Haversine formula to calculate distance between two points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

export default function JourneyPlanner() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [journey, setJourney] = useState(null);
  const [allCentroids, setAllCentroids] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [tubeDisruptions, setTubeDisruptions] = useState([]);
  const [isDisruptionsCollapsed, setIsDisruptionsCollapsed] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [stations, centroids, disruptions] = await Promise.all([
		fetchStations(),
		fetchCentroids(),
		fetchTubeDisruptions(),
	]);
        setStationOptions(stations);
        setAllCentroids(centroids);
        setTubeDisruptions(disruptions);
      } catch (err) {
        setError("Failed to initialize data: " + err.message);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const updateJourney = async () => {
      if (selectedStations.length > 0 && allCentroids) {
        setLoading(true);
        setError(null);
        try {
          const stationNames = selectedStations.map(station => station.value);
          const journeyData = await fetchJourneyData(stationNames);
          const journeyStations = journeyData.map(station => ({
            ...station,
            centroid: allCentroids[station.name],
          }));
          // Ensure the stations are in the same order as they were selected
          const orderedJourneyStations = stationNames.map(name => 
            journeyStations.find(station => station.name === name)
          );
          const journeyPath = calculateJourneyPath(orderedJourneyStations);
          const newJourney = {
            stations: orderedJourneyStations,
            path: journeyPath
          };
          setJourney(newJourney);
          console.log('Journey Data:', newJourney);
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
  }, [selectedStations, allCentroids]);

  const calculateJourneyPath = (stations) => {
    return stations.map(station => [station.centroid.lat, station.centroid.lon]);
  };

  const handleStationSelect = (selectedOptions) => {
    setSelectedStations(selectedOptions || []);
  };

  // This function represents how an API might return the journey data
  const getJourneyData = () => {
    if (!journey) return null;
    return {
      stations: journey.stations.map(station => ({
        name: station.name,
        centroid: station.centroid,
        pointCount: station.points.length
      })),
      path: journey.path,
      totalStations: journey.stations.length,
      totalPoints: journey.stations.reduce((sum, station) => sum + station.points.length, 0),
      totalDistance: calculateTotalDistance(journey.path),
      fareZones: calculateFareZones(journey.stations)
    };
  };

  // Helper function to calculate total distance (simplified)
  const calculateTotalDistance = (path) => {
    // This is a simplified calculation. In a real app, you'd use a more sophisticated method.
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const [lat1, lon1] = path[i-1];
      const [lat2, lon2] = path[i];
      total += getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
    }
    return total.toFixed(2);
  };

  // Helper function to calculate fare zones
  const calculateFareZones = (stations) => {
    const zones = new Set();
    stations.forEach(station => {
      station.centroid.fareZones.split('|').forEach(zone => zones.add(parseInt(zone)));
    });
    return Array.from(zones).sort((a, b) => a - b);
  };

  // Function to log journey data to console
  const logJourneyData = () => {
    console.log('Current Journey Data:', getJourneyData());
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const toggleDisruptions = () => {
    setIsDisruptionsCollapsed(!isDisruptionsCollapsed);
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
                <MapContent journey={journey} allCentroids={allCentroids} />
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
                  <p>Total Distance: {calculateTotalDistance(journey.path)} km</p>
                  <p>Fare Zones: {calculateFareZones(journey.stations).join(', ')}</p>
                  <div className="mt-2">
                    <h4 className="font-semibold">Stations and Platforms:</h4>
                    <ul className="list-disc pl-5">
                       {journey.stations.map((station, index) => (
                        <li key={index}>
                          {station.name} 
                          {station.centroid.platforms && station.centroid.platforms.length > 0 ? (
                            <span> - {station.centroid.platforms.length} platform(s)</span>
                          ) : (
                            <span> - No platform data</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {debugMode && (
                    <button 
                      onClick={logJourneyData}
                      className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Log Journey Data to Console
                    </button>
                  )}
                </div>
              )}
            </div>
           {tubeDisruptions.length > 0 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2" />
                    <h3 className="font-bold">Tube Disruptions ({tubeDisruptions.length})</h3>
                  </div>
                  <button onClick={toggleDisruptions} className="focus:outline-none">
                    {isDisruptionsCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>
                {!isDisruptionsCollapsed && (
                  <ul className="list-disc pl-5">
                    {tubeDisruptions.map((disruption, index) => (
                      <li key={index} className="mb-2">
                        <strong>{disruption.Type}: </strong>
                        {disruption.Description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
      <footer className="mt-8 text-center text-gray-600 relative">
        <p>© 2024 Louis Maddox : : <a href="https://spin.systems">spin.systems</a></p>
        <button 
          onClick={toggleDebugMode}
          className="absolute bottom-0 right-0 p-2 text-gray-500 hover:text-gray-700"
          aria-label="Toggle Debug Mode"
        >
          <Bug size={24} />
        </button>
      </footer>
    </div>
  );
}
