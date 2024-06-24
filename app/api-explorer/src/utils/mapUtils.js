import L from 'leaflet';

export const getFareZoneColor = (zone) => {
  const zoneColors = {
       1: '#FFFFFF', // White
       2: '#00A693', // Sea Green
       3: '#FFD900', // Mellow Yellow
       4: '#FF9900', // Mellow Orange
       5: '#AE84DD', // Pastel Purple
       6: '#EC7D91', // Baby Pink
       7: '#6f6f6f', // Pale White/Grey
       8: '#6f6f6f', // Pale White/Grey
       9: '#6f6f6f'  // Pale White/Grey
   };
   return zoneColors[zone] || '#6f6f6f'; // Default to Pale White/Grey for unknown zones
};

export const createCustomIcon = (color, size) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%;"></div>`,
    iconSize: [size, size],
  });
};

// Parse fare zone and get the lowest numerical zone
export const getLowestFareZone = (fareZones) => {
    if (!fareZones) return 7; // Default to 7 if no fare zone info
    const zones = fareZones.split('|').map(zone => parseInt(zone)).filter(zone => !isNaN(zone));
    return zones.length > 0 ? Math.min(...zones) : 7;
};

// Create a custom tube-style icon for stations
export const createStationIcon = (color, size = 24) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="${color}" stroke="black" stroke-width="2" stroke-dasharray="2,2"/>
    </svg>`;
    return L.divIcon({
        html: svg,
        className: 'custom-station-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};

// Create a custom tube-style icon for centroids (slightly smaller)
export const createCentroidIcon = (color, size = 20) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="black" />
      <circle cx="12" cy="12" r="8" fill="${color}" />
      <circle cx="12" cy="12" r="3" fill="black" />
    </svg>`;
    return L.divIcon({
        html: svg,
        className: 'custom-centroid-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};
