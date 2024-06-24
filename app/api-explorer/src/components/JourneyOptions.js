import React from 'react';

const JourneyOptions = ({ selectedStations, planJourney, journeyOptions }) => {
  return (
    <div>
      <button
        onClick={() => planJourney(selectedStations[0], selectedStations[1])}
        disabled={selectedStations.length !== 2}
        className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Plan Journey
      </button>
      
      {journeyOptions.length > 0 && (
        <div>
          <h2>Journey Options</h2>
          {journeyOptions.map((option, index) => (
            <div key={index} className="journey-option">
              <p>Option {index + 1}</p>
              <p>From {option.origin} to {option.destination}</p>
              <p>Take the {option.line} line</p>
              <p>Next train departs at: {new Date(option.departureTime).toLocaleTimeString()}</p>
              <p>From platform: {option.platform}</p>
              <p>Towards: {option.towards}</p>
              {option.frequency && <p>Trains run approximately every {option.frequency} minutes</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JourneyOptions;
