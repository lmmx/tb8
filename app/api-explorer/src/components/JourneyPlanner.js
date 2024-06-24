import React, { useState } from 'react';
import { fetchJourneyData, fetchArrivalsByStation } from '../utils/api_functions';

const calculateJourneyPath = (stations) => {
  return stations.map(station => [station.centroid.lat, station.centroid.lon]);
};

const JourneyPlanner = ({ selectedStations, allCentroids, setJourney, setLoading, setError }) => {
  const [journeyOptions, setJourneyOptions] = useState([]);

  const planJourney = async (origin, destination) => {
    console.log("Planning journey:", origin, destination);
    setLoading(true);
    setError(null);
    try {
      const originIds = origin.componentStations;
      const destinationIds = destination.componentStations;

      const fetchArrivals = async (ids) => {
        const arrivals = await Promise.all(ids.map(async (id) => {
          try {
            const response = await fetchArrivalsByStation(id);
            return response.results || [];
          } catch (error) {
            console.error(`Error fetching arrivals for station ${id}:`, error);
            return [];
          }
        }));
        return arrivals.flat();
      };

      const [allOriginArrivals, allDestinationArrivals] = await Promise.all([
        fetchArrivals(originIds),
        fetchArrivals(destinationIds)
      ]);

      const originLines = new Set(allOriginArrivals.map(arrival => arrival.LineId));
      const destinationLines = new Set(allDestinationArrivals.map(arrival => arrival.LineId));
      const commonLines = [...originLines].filter(line => destinationLines.has(line));

      if (commonLines.length === 0) {
        setError("No direct line found between the selected stations.");
        return;
      }

      const relevantArrivals = allOriginArrivals.filter(arrival => 
        commonLines.includes(arrival.LineId) &&
        new Date(arrival.ExpectedArrival) <= new Date(Date.now() + 60 * 60 * 1000)
      );

      if (relevantArrivals.length === 0) {
        setError("No upcoming trains found for this route in the next hour.");
        return;
      }

      const options = relevantArrivals.map(arrival => ({
        origin: origin.name,
        destination: destination.name,
        line: arrival.LineName,
        departureTime: arrival.ExpectedArrival,
        arrivalTime: null,
        platform: arrival.PlatformName,
        towards: arrival.Towards,
        frequency: null
      }));

      if (options.length > 1) {
        const timeDiffs = options.slice(1).map((option, index) => 
          new Date(option.departureTime) - new Date(options[index].departureTime)
        );
        const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        const frequency = Math.round(avgTimeDiff / 60000);
        options.forEach(option => option.frequency = frequency);
      }

      setJourneyOptions(options);

      const stationIds = selectedStations.map(station => station.value);
      const journeyData = await fetchJourneyData(stationIds);
      const journeyStations = journeyData.map(station => ({
        ...station,
        centroid: allCentroids[station.name],
      }));
      const orderedJourneyStations = stationIds.map(id => 
        journeyStations.find(station => station.centroid.id === id)
      );
      const journeyPath = calculateJourneyPath(orderedJourneyStations);
      const newJourney = {
        stations: orderedJourneyStations,
        path: journeyPath
      };
      setJourney(newJourney);
    } catch (err) {
      setError("Failed to plan journey: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => planJourney(allCentroids[selectedStations[0].label], allCentroids[selectedStations[1].label])}
        disabled={selectedStations.length !== 2}
        className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Plan Journey
      </button>
      
      {journeyOptions.length > 0 && (
        <div>
          <h2>Journey Options</h2>
          {journeyOptions.map((option, index) => (
            <div key={index} className="journey-option">
              <p>Option {index + 1}</p>
              <p>From {option.origin} to {option.destination}</p>
              <p>Take the {option.line} line</p>
              <p>Next train departs at: {new Date(option.departureTime).toLocaleTimeString()}</p>
              <p>From platform: {option.platform}</p>
              <p>Towards: {option.towards}</p>
              {option.frequency && <p>Trains run approximately every {option.frequency} minutes</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JourneyPlanner;
