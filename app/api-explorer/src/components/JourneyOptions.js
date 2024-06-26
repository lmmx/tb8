import React from 'react';
import { Clock, MapPin, ArrowRight, AlertTriangle } from 'lucide-react';
import { renderLineRoundels, getLineColor } from './LineRoundels';

const JourneyOptions = ({ selectedStations, planJourney, journeyOptions }) => {
  return (
    <div className="space-y-4">
      <button
        onClick={() => planJourney(selectedStations[0], selectedStations[1])}
        disabled={selectedStations.length !== 2}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Plan Journey
      </button>
      
      {journeyOptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Journey Options</h2>
          {journeyOptions.map((option, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300 ease-in-out">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-500">Option {index + 1}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {new Date(option.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700">{option.origin}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <MapPin className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-700">{option.destination}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                {renderLineRoundels([{ Line: option.lineId }])}
                <span className="text-gray-600" style={{ color: getLineColor(option.lineId) }}>
                  {option.lineName} line
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Platform: {option.platform}</div>
                <div>Towards: {option.towards}</div>
                {option.frequency && (
                  <div className="col-span-2 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>Trains every ~{option.frequency} mins</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JourneyOptions;
