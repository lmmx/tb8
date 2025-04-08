import React from 'react';
import { calculateTotalDistance, calculateFareZones } from '../utils/journeyUtils';

const JourneySummary = ({ journey, debugMode }) => {
  if (!journey) return null;

  const logJourneyData = () => {
    console.log('Current Journey Data:', {
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
    });
  };

  return (
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
  );
};

export default JourneySummary;
