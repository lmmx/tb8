import { getDistanceFromLatLonInKm } from './measurement';

export const calculateJourneyPath = (stations) => {
  return stations.map(station => [station.centroid.lat, station.centroid.lon]);
};

export const calculateTotalDistance = (path) => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const [lat1, lon1] = path[i-1];
    const [lat2, lon2] = path[i];
    total += getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2);
  }
  return total.toFixed(2);
};

export const calculateFareZones = (stations) => {
  const zones = new Set();
  stations.forEach(station => {
    station.centroid.fareZones.split('|').forEach(zone => zones.add(parseInt(zone)));
  });
  return Array.from(zones).sort((a, b) => a - b);
};
