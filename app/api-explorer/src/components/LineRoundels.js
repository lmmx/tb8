import React from 'react';

// Function to get line color
export const getLineColor = (line) => {
  const lineColors = {
    'bakerloo': '#B36305',
    'central': '#E32017',
    'circle': '#FFD300',
    'district': '#00782A',
    'hammersmith-city': '#F3A9BB',
    'jubilee': '#A0A5A9',
    'metropolitan': '#9B0056',
    'northern': '#000000',
    'piccadilly': '#003688',
    'victoria': '#0098D4',
    'waterloo-city': '#95CDBA',
    'elizabeth': '#6950a1',
    'dlr': '#00AFAD',
    'london-overground': '#EE7C0E',
  };
  return lineColors[line.toLowerCase()] || '#6f6f6f'; // Default to grey for unknown lines
};

const createRoundel = (color, size = 30) => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 480 390">
      <title>Tube Roundel</title>
      <g stroke="${color}" fill="none">
        <path d="M 0,195 H 480" stroke-width="75" />
        <circle cx="240" cy="195" r="161.25" stroke-width="67.5" />
      </g>
    </svg>
  `;
};

export const renderLineRoundels = (platforms, size = 30) => {
  if (!platforms || platforms.length === 0) return null;
  const lines = [...new Set(platforms.map(platform => platform.Line))];
  return (
    <div className="flex flex-wrap gap-1">
      {lines.map(line => (
        <div key={line} dangerouslySetInnerHTML={{ __html: createRoundel(getLineColor(line), size) }} />
      ))}
    </div>
  );
};
