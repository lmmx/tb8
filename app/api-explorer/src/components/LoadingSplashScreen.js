import React from 'react';
import { Train } from 'lucide-react';

const LoadingSplashScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
      <div className="relative text-center z-10">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="w-24 h-24 border-t-4 border-b-4 border-white rounded-full animate-spin"></div>
          <Train className="w-12 h-12 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
          Tubeulator is coming
        </h2>
        <p className="text-xl text-white">
          It's almost time for the tubeulator...
        </p>
      </div>
    </div>
  );
};

export default LoadingSplashScreen;
