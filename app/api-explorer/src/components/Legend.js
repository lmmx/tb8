import React from 'react';
import { getFareZoneColor } from '../utils/mapUtils';

const Legend = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-md">
      <h3 className="text-xl font-semibold mb-3 text-gray-700">Legend</h3>
      <div className="flex mb-3">
        <div className="flex items-center w-1/2">
          <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
            <circle cx="12" cy="12" r="9" fill="white" stroke="black" strokeWidth="2" strokeDasharray="2,2"/>
          </svg>
          <span className="text-sm text-gray-600">Station Point</span>
        </div>
        <div className="flex items-center w-1/2">
          <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
            <circle cx="12" cy="12" r="10" fill="black" />
            <circle cx="12" cy="12" r="8" fill="white" />
            <circle cx="12" cy="12" r="3" fill="black" />
          </svg>
          <span className="text-sm text-gray-600">Station Centroid</span>
        </div>
      </div>
      <div className="flex flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map(zone => (
          <div key={zone} className="flex items-center w-1/3 mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2">
              <circle cx="12" cy="12" r="9" fill={getFareZoneColor(zone)} />
            </svg>
            <span className="text-sm text-gray-600">
              Zone {zone}{zone > 6 ? '+' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
