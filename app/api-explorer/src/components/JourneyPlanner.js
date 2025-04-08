import React, { useState, useEffect } from 'react';
import JourneyOptions from './JourneyOptions';
import {
  fetchArrivals,
  getCommonLines,
  getRelevantArrivals,
  createJourneyOptions,
  createJourney,
  getRouteDirection,
  buildNetworkGraph
} from '../utils/plannerUtils';

const JourneyPlanner = ({ selectedStations, allCentroids, setJourney, setLoading, setError, routes, routeSequences }) => {
  const [journeyOptions, setJourneyOptions] = useState([]);
  const [networkGraph, setNetworkGraph] = useState(null);

  useEffect(() => {
    // Build the network graph when component mounts or when routes/routeSequences change
    if (routes && routeSequences) {
      const graph = buildNetworkGraph(Object.values(allCentroids), routeSequences);
      setNetworkGraph(graph);
    }
  }, [routes, routeSequences, allCentroids]);

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

      if (!networkGraph) {
        setError("Network graph is not ready. Please try again.");
        return;
      }

      // Here you would implement the logic to find the path using the networkGraph
      // For now, we'll just log the graph for the selected stations
      console.log("Network graph for origin:", networkGraph[origin.id]);
      console.log("Network graph for destination:", networkGraph[destination.id]);


      // console.log('from', origin, 'to', destination);
      const [allOriginArrivals, allDestinationArrivals] = await Promise.all([
        fetchArrivals(origin.componentStations),
        fetchArrivals(destination.componentStations)
      ]);

      const commonLines = getCommonLines(allOriginArrivals, allDestinationArrivals);

      if (commonLines.length === 0) {
        console.log("No direct line found. Multi-line journey planning needed.");
        console.log("Couldn't resolve from:", allOriginArrivals, "to:", allDestinationArrivals);
        setError("No direct line found between the selected stations. Multi-line journeys are not yet implemented.");
        return;
      }

      const relevantArrivals = getRelevantArrivals(allOriginArrivals, commonLines);

      if (relevantArrivals.length === 0) {
        setError("No upcoming trains found for this route in the next hour.");
        return;
      }

      const options = createJourneyOptions(relevantArrivals, origin, destination, routeSequences);
      setJourneyOptions(options);

      const newJourney = await createJourney(selectedStations, allCentroids, routes);
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
