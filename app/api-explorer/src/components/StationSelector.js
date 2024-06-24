import React from 'react';
import Select from 'react-select';

const StationSelector = ({ stationOptions, selectedStations, setSelectedStations, loading, error }) => {
  const handleStationSelect = (selectedOptions) => {
    setSelectedStations(selectedOptions || []);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-md mb-6">
      <div className="mb-4">
        <label htmlFor="station-select" className="block mb-2 font-medium text-gray-600">
          Select Stations for Your Journey:
        </label>
        <Select
          id="station-select"
          options={stationOptions}
          value={selectedStations}
          onChange={handleStationSelect}
          placeholder="Type to search for stations..."
          isMulti
          className="text-gray-700"
          styles={{
            control: (provided) => ({
              ...provided,
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e0' }
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected ? '#4299e1' : state.isFocused ? '#ebf8ff' : null,
              color: state.isSelected ? 'white' : '#4a5568'
            })
          }}
        />
      </div>
      {loading && (
        <div className="flex items-center justify-center p-4 bg-blue-100 rounded">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-blue-600">Loading...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default StationSelector;
