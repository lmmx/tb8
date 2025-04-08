import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-fullscreen/styles.css';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './components/MapContent';
import { fetchStations, fetchCentroids, fetchTubeDisruptions, fetchRouteData } from './utils/api_functions';
import LoadingSplashScreen from './components/LoadingSplashScreen';
import JourneyPlanner from './components/JourneyPlanner';
import MapContent from './components/MapContent';
import StationSelector from './components/StationSelector';
import JourneySummary from './components/JourneySummary';
import TubeDisruptions from './components/TubeDisruptions';
import Legend from './components/Legend';
import Footer from './components/Footer';
import { Map, Train, Waypoints } from 'lucide-react';

export default function App() {
  const [stationOptions, setStationOptions] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [journey, setJourney] = useState(null);
  const [allCentroids, setAllCentroids] = useState(null);
  const [error, setError] = useState(null);
  const [setupIsLoading, setSetupIsLoading] = useState(true);
  const [loadingSteps, setLoadingSteps] = useState({
    serverAwake: 'pending',
    centroids: 'pending',
    disruptions: 'pending',
    routeData: 'pending',
    // processing: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [tubeDisruptions, setTubeDisruptions] = useState([]);
  const [routeData, setRouteData] = useState({ routes: null, routeSequences: null });

  useEffect(() => {
    const initializeData = async () => {
      setSetupIsLoading(true);
      try {
        let isServerAwake = false;
        const updateStep = (step, status) => {
          setLoadingSteps(prev => ({ ...prev, [step]: status }));
        };

        const checkServerAwake = async () => {
          updateStep('serverAwake', 'loading');
          await fetch('https://tb8.onrender.com/');
          updateStep('serverAwake', 'complete');
        };

        const fetchCentroidsWrapper = async () => {
          updateStep('centroids', 'loading');
          const result = await fetchCentroids();
          updateStep('serverAwake', 'complete');
          updateStep('centroids', 'complete');
          return result;
        };

        const fetchDisruptionsWrapper = async () => {
          updateStep('disruptions', 'loading');
          const result = await fetchTubeDisruptions();
          updateStep('serverAwake', 'complete');
          updateStep('disruptions', 'complete');
          return result;
        };

        const fetchRouteDataWrapper = async () => {
          updateStep('routeData', 'loading');
          const result = await fetchRouteData();
          updateStep('serverAwake', 'complete');
          updateStep('routeData', 'complete');
          return result;
        };

        const [centroids, disruptions, { routeData, routeSequenceData }] = await Promise.all([
          checkServerAwake(),
          fetchCentroidsWrapper(),
          fetchDisruptionsWrapper(),
          fetchRouteDataWrapper(),
        ]).then(([, centroids, disruptions, routeData]) => [centroids, disruptions, routeData]);

        // updateStep('processing', 'loading');
        const stations = Object.values(centroids).map(station => ({
          value: station.id,
          label: station.name
        }));
        stations.sort((a, b) => a.label.localeCompare(b.label));
        setStationOptions(stations);
        setAllCentroids(centroids);
        setTubeDisruptions(disruptions);
        setRouteData({ routes: routeData, routeSequences: routeSequenceData });
        // updateStep('processing', 'complete');
      } catch (err) {
        setError("Failed to initialize data: " + err.message);
        setLoadingSteps(prev => Object.fromEntries(Object.keys(prev).map(key => [key, 'error'])));
      } finally {
        setSetupIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const handlePlanJourney = () => {
    if (selectedStations.length === 2) {
      // This assumes your JourneyPlanner component has a planJourney method
      // If it doesn't, you'll need to implement the journey planning logic here
      // or create a separate function for it
      const journeyPlannerRef = document.querySelector('button');
      if (journeyPlannerRef) {
        journeyPlannerRef.click();
      }
    }
  };

  if (setupIsLoading) {
    return <LoadingSplashScreen loadingSteps={loadingSteps} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
      <div className="container mx-auto max-w-6xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800 border-b-2 border-gray-200 pb-4 flex items-center justify-center">
          <Waypoints className="w-10 h-10 mr-2 text-blue-500" />
          Tubeulator
          <Waypoints className="w-10 h-10 ml-2 text-blue-500" />
        </h1>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <div className="bg-gray-100 rounded-lg overflow-hidden shadow-md relative" style={{ height: '600px' }}>
              <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                <MapContent
                  journey={journey}
                  allCentroids={allCentroids}
                  routeSequenceData={routeData.routeSequences}
                />
              </MapContainer>
              <div className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-md">
                <Map className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Train className="w-6 h-6 mr-2 text-blue-500" />
                Plan Your Journey
              </h2>
              <StationSelector
                stationOptions={stationOptions}
                selectedStations={selectedStations}
                setSelectedStations={setSelectedStations}
                loading={loading}
                error={error}
                onPlanJourney={handlePlanJourney}
              />
              <JourneyPlanner
                selectedStations={selectedStations}
                allCentroids={allCentroids}
                setJourney={setJourney}
                setLoading={setLoading}
                setError={setError}
                routes={routeData.routes}
                routeSequences={routeData.routeSequences}
              />
            </div>
            <JourneySummary
              journey={journey}
              debugMode={debugMode}
            />
            <TubeDisruptions disruptions={tubeDisruptions} />
            <Legend />
          </div>
        </div>
      </div>
      <Footer toggleDebugMode={toggleDebugMode} />
    </div>
  );
}
