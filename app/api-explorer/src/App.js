import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './components/MapContent';
import { fetchStations, fetchCentroids, fetchTubeDisruptions, fetchRouteData } from './utils/api_functions';
import JourneyPlanner from './components/JourneyPlanner';
import MapContent from './components/MapContent';
import StationSelector from './components/StationSelector';
import JourneySummary from './components/JourneySummary';
import TubeDisruptions from './components/TubeDisruptions';
import Legend from './components/Legend';
import Footer from './components/Footer';

export default function App() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [journey, setJourney] = useState(null);
  const [allCentroids, setAllCentroids] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [tubeDisruptions, setTubeDisruptions] = useState([]);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [centroids, disruptions, routes] = await Promise.all([
          fetchCentroids(),
          fetchTubeDisruptions(),
          fetchRouteData(),
        ]);
        const stations = Object.values(centroids).map(station => ({
          value: station.id,
          label: station.name
        }));
        stations.sort((a, b) => a.label.localeCompare(b.label));
        setStationOptions(stations);
        setAllCentroids(centroids);
        setTubeDisruptions(disruptions);
        setRouteData(routes);
      } catch (err) {
        setError("Failed to initialize data: " + err.message);
      }
    };

    initializeData();
  }, []);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
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
            <StationSelector 
              stationOptions={stationOptions}
              selectedStations={selectedStations}
              setSelectedStations={setSelectedStations}
              loading={loading}
              error={error}
            />
            <JourneySummary 
              journey={journey}
              debugMode={debugMode}
            />
            <TubeDisruptions disruptions={tubeDisruptions} />
            <JourneyPlanner 
              selectedStations={selectedStations}
              allCentroids={allCentroids}
              setJourney={setJourney}
              setLoading={setLoading}
              setError={setError}
	      routeData={routeData}
            />
            <Legend />
          </div>
        </div>
      </div>
      <Footer toggleDebugMode={toggleDebugMode} />
    </div>
  );
}
