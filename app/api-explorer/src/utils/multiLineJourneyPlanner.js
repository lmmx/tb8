// multiLineJourneyPlanner.js

import { fetchArrivals, getRelevantArrivals, getRouteDirection } from './plannerUtils';

// Function to build the graph of the tube network using component stations
const buildNetworkGraph = (stations, routeSequenceData) => {
  const graph = {};

  stations.forEach(station => {
    station.componentStations.forEach(componentId => {
      graph[componentId] = {};
    });
  });

  routeSequenceData.forEach(route => {
    route.OrderedLineRoutes.forEach(lineRoute => {
      for (let i = 0; i < lineRoute.NaptanIds.length - 1; i++) {
        const currentStation = lineRoute.NaptanIds[i];
        const nextStation = lineRoute.NaptanIds[i + 1];
        graph[currentStation][nextStation] = route.LineId;
        graph[nextStation][currentStation] = route.LineId;
      }
    });
  });

  return graph;
};

// Breadth-First Search to find the shortest path
const findShortestPath = (graph, start, end) => {
  const queue = [[start]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const station = path[path.length - 1];

    if (station === end) {
      return path;
    }

    if (!visited.has(station)) {
      visited.add(station);
      const neighbors = Object.keys(graph[station] || {});
      for (const neighbor of neighbors) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No path found
};

// Function to get journey details for a path
const getJourneyDetails = async (path, graph, stations, routeSequenceData) => {
  const journeySegments = [];
  for (let i = 0; i < path.length - 1; i++) {
    const originId = path[i];
    const destinationId = path[i + 1];
    const line = graph[originId][destinationId];

    const origin = stations.find(s => s.componentStations.includes(originId));
    const destination = stations.find(s => s.componentStations.includes(destinationId));

    const arrivals = await fetchArrivals([originId]);
    const relevantArrivals = getRelevantArrivals(arrivals, [line]);
    const direction = getRouteDirection({id: originId}, {id: destinationId}, line, routeSequenceData);

    journeySegments.push({
      origin: origin.name,
      destination: destination.name,
      line: line,
      direction: direction,
      arrivals: relevantArrivals
    });
  }
  return journeySegments;
};

// Helper function to find all component stations for a parent station
const findComponentStations = (station, stations) => {
  const componentStation = stations.find(s => s.id === station.id);
  return componentStation ? componentStation.componentStations : [station.id];
};

// Main function to plan a multi-line journey
export const planMultiLineJourney = async (origin, destination, stations, routeSequenceData) => {
  const graph = buildNetworkGraph(stations, routeSequenceData);

  const originComponents = findComponentStations(origin, stations);
  const destinationComponents = findComponentStations(destination, stations);

  let shortestPath = null;
  let shortestLength = Infinity;

  for (const startComponent of originComponents) {
    for (const endComponent of destinationComponents) {
      const path = findShortestPath(graph, startComponent, endComponent);
      if (path && path.length < shortestLength) {
        shortestPath = path;
        shortestLength = path.length;
      }
    }
  }

  if (!shortestPath) {
    throw new Error("No valid path found between the selected stations.");
  }

  const journeyDetails = await getJourneyDetails(shortestPath, graph, stations, routeSequenceData);

  return {
    path: shortestPath,
    segments: journeyDetails
  };
};
