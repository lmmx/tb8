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

// Function to create SVG roundel
const createRoundel = (color) => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="32" viewBox="0 0 640 520">
      <title>Tube Roundel</title>
      <g stroke="${color}" fill="none">
        <path d="M 0,260 H 640" stroke-width="100" />
        <circle cx="320" cy="260" r="215" stroke-width="90" />
      </g>
    </svg>
  `;
};

// Function to render line roundels
export const renderLineRoundels = (platforms) => {
  if (!platforms || platforms.length === 0) return null;
  
  const lines = [...new Set(platforms.map(platform => platform.Line))];
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {lines.map(line => (
        <div key={line} dangerouslySetInnerHTML={{ __html: createRoundel(getLineColor(line)) }} />
      ))}
    </div>
  );
};
