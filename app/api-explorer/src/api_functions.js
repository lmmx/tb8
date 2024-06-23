const API_BASE_URL = 'https://tb8.onrender.com';

export const fetchStations = async () => {
  const response = await fetch(`${API_BASE_URL}/stations?query=${encodeURIComponent('SELECT DISTINCT StationName FROM self ORDER BY StationName;')}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.results.map(station => ({ 
    value: station.StationName, 
    label: station.StationName 
  }));
};

export const fetchJourneyData = async (stationNames) => {
  const names = stationNames.map(name => `'${name.replace("'", "''")}'`).join(', ');
  const query = `SELECT * FROM self WHERE StationName IN (${names});`;
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
      wifi: centroid.Wifi
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
        acc[platform.StationName] = [];
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
