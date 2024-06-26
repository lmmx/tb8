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

export const getRouteDirection = (origin, destination, lineId, routeSequenceData) => {
  // console.log(`Getting route direction for ${origin.id} to ${destination.id} on line ${lineId}`);
  // console.log('Examining routes:', routeSequenceData);
  // console.log('For example', routeSequenceData[0].OrderedLineRoutes);
  const relevantRoutes = routeSequenceData.filter(route => 
    route.LineId === lineId &&
    route.OrderedLineRoutes.some(lineRoute => 
      lineRoute.NaptanIds.includes(origin.id) && 
      lineRoute.NaptanIds.includes(destination.id)
    )
  );
  // console.log('Relevant routes:', relevantRoutes);

  for (const route of relevantRoutes) {
    const lineRoute = route.OrderedLineRoutes.find(lr => 
      lr.NaptanIds.includes(origin.id) && lr.NaptanIds.includes(destination.id)
    );
    if (lineRoute) {
      const originIndex = lineRoute.NaptanIds.indexOf(origin.id);
      const destinationIndex = lineRoute.NaptanIds.indexOf(destination.id);
      const direction = originIndex < destinationIndex ? route.Direction : 
        (route.Direction === 'inbound' ? 'outbound' : 'inbound');
      console.log(`Found direction: ${direction}`);
      return direction;
    }
  }
  // console.log('No direction found');
  return null;
};

export const createJourneyOptions = (relevantArrivals, origin, destination, routeSequenceData) => {
  console.log('All arrivals', relevantArrivals);
  const options = relevantArrivals.flatMap(arrival => {
    const correctDirections = origin.componentStations.flatMap(originStation =>
      destination.componentStations.map(destinationStation => {
        const direction = getRouteDirection(
          { id: originStation },
          { id: destinationStation },
          arrival.LineId,
          routeSequenceData
        );
        return direction === arrival.Direction ? direction : null;
      })
    ).filter(Boolean);

    console.log('Correct direction(s) for arrival:', correctDirections);

    if (correctDirections.length > 0) {
      return [{
        origin: origin.name,
        destination: destination.name,
        lineId: arrival.LineId,
        lineName: arrival.LineName,
        departureTime: arrival.ExpectedArrival,
        arrivalTime: null,
        platform: arrival.PlatformName,
        towards: arrival.Towards,
        direction: correctDirections[0],
        destinationNaptanId: arrival.DestinationNaptanId,
        frequency: null
      }];
    }
    return []; // Return an empty array if no correct direction is found
  });

  console.log('Filtered journey options:', options);

  options.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

  if (options.length > 1) {
    const timeDiffs = options.slice(1).map((option, index) => 
      new Date(option.departureTime) - new Date(options[index].departureTime)
    );
    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const frequency = Math.round(avgTimeDiff / 60000);
    options.forEach(option => option.frequency = frequency);
  }

  return options;
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
