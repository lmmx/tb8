import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const TubeDisruptions = ({ disruptions }) => {
  const [isDisruptionsCollapsed, setIsDisruptionsCollapsed] = useState(true);

  const toggleDisruptions = () => {
    setIsDisruptionsCollapsed(!isDisruptionsCollapsed);
  };

  if (disruptions.length === 0) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <AlertTriangle className="mr-2" />
          <h3 className="font-bold">Tube Disruptions ({disruptions.length})</h3>
        </div>
        <button onClick={toggleDisruptions} className="focus:outline-none">
          {isDisruptionsCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>
      {!isDisruptionsCollapsed && (
        <ul className="list-disc pl-5">
          {disruptions.map((disruption, index) => (
            <li key={index} className="mb-2">
              <strong>{disruption.Type}: </strong>
              {disruption.Description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TubeDisruptions;
