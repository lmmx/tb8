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

export const createJourneyOptions = (relevantArrivals, origin, destination) => {
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

  return options;
};

export const createJourney = async (selectedStations, allCentroids) => {
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
  return {
    stations: orderedJourneyStations,
    path: journeyPath
  };
};
