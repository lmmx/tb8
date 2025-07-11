export const API_BASE_URL = 'https://tb8-production.up.railway.app';

export const fetchStations = async () => {
  const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent('SELECT StationUniqueId, StationName FROM self ORDER BY StationName;')}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
	console.log(data.results);
  return data.results.map(station => ({
    value: station.StationUniqueId,
    label: station.StationName
  }));
};

export const fetchJourneyData = async (stationIds) => {
  const ids = stationIds.map(id => `'${id}'`).join(', ');
  const query = `SELECT * FROM self WHERE StationUniqueId IN (${ids});`;
  const response = await fetch(`${API_BASE_URL}/station-points?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();

  // Group points by station name
  const stationMap = data.results.reduce((acc, point) => {
    if (typeof point.Lat === 'number' && typeof point.Lon === 'number' && !isNaN(point.Lat) && !isNaN(point.Lon)) {
      if (!acc[point.StationName]) {
        acc[point.StationName] = {
          name: point.StationName,
          points: []
        };
      }
      acc[point.StationName].points.push({
        id: point.UniqueId,
        lat: point.Lat,
        lon: point.Lon,
        area: point.AreaName,
        level: point.Level,
        fareZones: point.FareZones,
        wifi: point.Wifi
      });
    }
    return acc;
  }, {});

  return Object.values(stationMap);
};

export const fetchCentroids = async () => {
  const query = 'SELECT DISTINCT ON (StationUniqueId) * FROM self;';
  const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  const platformData = await fetchPlatformData();
  return data.results.filter(centroid =>
    typeof centroid.Lat === 'number' &&
    typeof centroid.Lon === 'number' &&
    !isNaN(centroid.Lat) &&
    !isNaN(centroid.Lon)
  ).reduce((acc, centroid) => {
    acc[centroid.StationName] = {
      id: centroid.StationUniqueId,
      name: centroid.StationName,
      lat: centroid.Lat,
      lon: centroid.Lon,
      fareZones: centroid.FareZones,
      wifi: centroid.Wifi,
      platforms: platformData[centroid.StationName] || [],
      componentStations: centroid.ComponentStations
    };
    return acc;
  }, {});
};

export const fetchTubeDisruptions = async () => {
  const response = await fetch(`${API_BASE_URL}/disruption-by-modes?query=tube`);
  if (!response.ok) throw new Error('Failed to fetch tube disruptions');
  const data = await response.json();
  if (data.success && data.results) {
    return data.results;
  } else {
    throw new Error('Invalid disruption data format');
  }
};

export const fetchPlatformData = async () => {
  const response = await fetch(`${API_BASE_URL}/platforms?query=${encodeURIComponent('SELECT * FROM self;')}`);
  if (!response.ok) throw new Error('Failed to fetch platform data');
  const data = await response.json();
  if (data.success && data.results) {
    const platforms = data.results.reduce((acc, platform) => {
      if (!acc[platform.StationName]) {
        acc[platform.StationName] = []
      }
      acc[platform.StationName].push(platform);
      return acc;
    }, {});

    console.log("Platform data fetched:", platforms);
    return platforms;
  } else {
    throw new Error('Invalid platform data format');
  }
};

export const fetchRouteData = async () => {
  try {
    const routeResponse = await fetch(`${API_BASE_URL}/route-by-modes?query=tube`);
    const routeData = await routeResponse.json();
	  console.log('fetched route data', routeData);
    const routeSequencePromises = routeData.results.flatMap(route =>
      ['inbound', 'outbound'].map(direction =>
        fetch(`${API_BASE_URL}/route-sequence-by-line-direction?line=${route.Id}&direction=${direction}`)
          .then(res => res.json())
      )
    );
    const routeSequenceData = await Promise.all(routeSequencePromises);
    return { routeData: routeData.results, routeSequenceData: routeSequenceData.flatMap(data => data.results) };
  } catch (error) {
    console.error("Error fetching route data:", error);
    return { routeData: [], routeSequenceData: [] };
  }
};

export const fetchArrivalsByLines = async (lines) => {
  const lineQuery = lines.join(',');
  const response = await fetch(`${API_BASE_URL}/arrivals-by-lines?query=${lineQuery}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const fetchArrivalsByStation = async (stationIds) => {
  const idsQuery = Array.isArray(stationIds) ? stationIds.join(',') : stationIds;
  const response = await fetch(`${API_BASE_URL}/arrivals-by-station?query=${idsQuery}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};
