import { fetchJourneyData, fetchArrivalsByStation } from '../utils/api_functions';

export const calculateJourneyPath = (stations) => {
  return stations.map(station => [station.centroid.lat, station.centroid.lon]);
};

export const fetchArrivals = async (ids) => {
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

export const getCommonLines = (originArrivals, destinationArrivals) => {
  const originLines = new Set(originArrivals.map(arrival => arrival.LineId));
  const destinationLines = new Set(destinationArrivals.map(arrival => arrival.LineId));
  return [...originLines].filter(line => destinationLines.has(line));
};

export const getRelevantArrivals = (allOriginArrivals, commonLines) => {
  return allOriginArrivals.filter(arrival => 
    commonLines.includes(arrival.LineId) &&
    new Date(arrival.ExpectedArrival) <= new Date(Date.now() + 60 * 60 * 1000)
  );
};

export const getRouteDirection = (originNaptanId, destinationNaptanId, lineId, routeData) => {
  const lineRoutes = routeData.filter(route => route.Id === lineId);
  for (const route of lineRoutes) {
    const routeSection = route.RouteSections.find(section => 
     section.Destination === destinationNaptanId
    );
    if (routeSection) {
      return route.Direction;
    }
  }
  return null;
};

export const createJourneyOptions = (relevantArrivals, origin, destination, routeData) => {
  const options = relevantArrivals.map(arrival => {
    const direction = getRouteDirection(origin.id, arrival.DestinationNaptanId, arrival.LineId, routeData);
    return {
      origin: origin.name,
      destination: destination.name,
      lineId: arrival.LineId,
      lineName: arrival.LineName,
      departureTime: arrival.ExpectedArrival,
      arrivalTime: null,
      platform: arrival.PlatformName,
      towards: arrival.Towards,
      direction: direction,
      destinationNaptanId: arrival.DestinationNaptanId,
      frequency: null
    };
  });

	console.log('options::', destination, options);
  // Filter options to include only those going in the correct direction
  const filteredOptions = options.filter(option => 
    option.direction && option.destinationNaptanId === destination.id
  );
	console.log('filtered options', filteredOptions);

  filteredOptions.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  if (filteredOptions.length > 1) {
    const timeDiffs = filteredOptions.slice(1).map((option, index) => 
      new Date(option.departureTime) - new Date(filteredOptions[index].departureTime)
    );
    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const frequency = Math.round(avgTimeDiff / 60000);
    filteredOptions.forEach(option => option.frequency = frequency);
  }

  return filteredOptions;
};

export const createJourney = async (selectedStations, allCentroids, routeData) => {
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

  // Find the route for this journey
  const origin = orderedJourneyStations[0];
  const destination = orderedJourneyStations[orderedJourneyStations.length - 1];
  const commonLines = getCommonLines(
    origin.centroid.platforms, 
    destination.centroid.platforms
  );
  
  let route = null;
  if (commonLines.length > 0) {
    const lineId = commonLines[0];
    route = routeData.find(r => 
      r.LineId === lineId && 
      r.RouteSections.some(section => 
        section.Originator === origin.centroid.id && 
        section.Destination === destination.centroid.id
      )
    );
  }

  return {
    stations: orderedJourneyStations,
    path: journeyPath,
    route: route
  };
};
