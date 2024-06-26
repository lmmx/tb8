import React from 'react';
import { TrainFront, Server, Database, AlertTriangle, Map, Cpu, CheckCircle, Clock, Sunrise } from 'lucide-react';

const LoadingSplashScreen = ({ loadingSteps }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-300" />;
      case 'loading':
        return <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 'serverAwake':
        return <Sunrise className="w-5 h-5 mr-2" />;
      case 'centroids':
        return <Database className="w-5 h-5 mr-2" />;
      case 'disruptions':
        return <AlertTriangle className="w-5 h-5 mr-2" />;
      case 'routeData':
        return <Map className="w-5 h-5 mr-2" />;
      case 'processing':
        return <Cpu className="w-5 h-5 mr-2" />;
      default:
        return <Server className="w-5 h-5 mr-2" />;
    }
  };

  const getTrafficLightColor = () => {
    const completedSteps = Object.values(loadingSteps).filter(status => status === 'complete').length;
    const totalSteps = Object.keys(loadingSteps).length;
    
    if (completedSteps === 0) return 'border-red-500';
    if (completedSteps === totalSteps) return 'border-green-500';
    return 'border-yellow-500';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
      <div className="relative text-center z-10 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className={`w-24 h-24 border-t-4 border-b-4 rounded-full animate-spin ${getTrafficLightColor()}`}></div>
          <TrainFront className="w-12 h-12 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2 animate-pulse">
          Tubeulator is coming
        </h2>
        <p className="text-xl text-gray-600 mb-4">
          It's time for the tubeulator...
        </p>
        <div className="space-y-2">
          {Object.entries(loadingSteps).map(([step, status]) => (
            <div key={step} className="flex items-center justify-between">
              <div className="flex items-center">
                {getStepIcon(step)}
                <span className="text-sm text-gray-700 capitalize">{step}</span>
              </div>
              {getStatusIcon(status)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSplashScreen;
