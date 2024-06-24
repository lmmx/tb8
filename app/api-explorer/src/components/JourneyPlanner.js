import React, { useState } from 'react';
import JourneyOptions from './JourneyOptions';
import { 
  fetchArrivals, 
  getCommonLines, 
  getRelevantArrivals, 
  createJourneyOptions, 
  createJourney,
  getRouteDirection
} from '../utils/plannerUtils';

const JourneyPlanner = ({ selectedStations, allCentroids, setJourney, setLoading, setError, routeData }) => {
  const [journeyOptions, setJourneyOptions] = useState([]);

  const findCentroidByStationId = (stationId) => {
    return Object.values(allCentroids).find(centroid => centroid.id === stationId);
  };

  const planJourney = async (originStation, destinationStation) => {
    console.log("Planning journey:", originStation, destinationStation);
    setLoading(true);
    setError(null);
    try {
      const origin = findCentroidByStationId(originStation.value);
      const destination = findCentroidByStationId(destinationStation.value);

      if (!origin || !destination) {
        setError("Could not find centroid data for one or both stations.");
        return;
      }

      const [allOriginArrivals, allDestinationArrivals] = await Promise.all([
        fetchArrivals(origin.componentStations),
        fetchArrivals(destination.componentStations)
      ]);

      const commonLines = getCommonLines(allOriginArrivals, allDestinationArrivals);

      if (commonLines.length === 0) {
        setError("No direct line found between the selected stations.");
        return;
      }

      const relevantArrivals = getRelevantArrivals(allOriginArrivals, commonLines);

      if (relevantArrivals.length === 0) {
        setError("No upcoming trains found for this route in the next hour.");
        return;
      }

      const options = createJourneyOptions(relevantArrivals, origin, destination, routeData);
      setJourneyOptions(options);

      const newJourney = await createJourney(selectedStations, allCentroids, routeData);
      setJourney(newJourney);
    } catch (err) {
      setError("Failed to plan journey: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <JourneyOptions 
      selectedStations={selectedStations}
      planJourney={planJourney}
      journeyOptions={journeyOptions}
    />
  );
};

export default JourneyPlanner;
