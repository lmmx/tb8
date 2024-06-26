import React, { useState, useEffect } from 'react';
import { TrainFront, Moon, Sunrise, Map, AlertTriangle } from 'lucide-react';

const LoadingSplashScreen = () => {
  const [status, setStatus] = useState('waiting');
  const [message, setMessage] = useState('Waiting for the server to wake up');

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetch('https://tb8.onrender.com/');
        setStatus('awake');
        setMessage('Server is awake!');

        await fetch('https://tb8.onrender.com/lines');
        setStatus('ready');
        setMessage('Map data received');
      } catch (error) {
        console.error('Error:', error);
        setStatus('error');
        setMessage('An error occurred');
      }
    };

    fetchData();
  }, []);

  const getTrafficLightColor = () => {
    switch (status) {
      case 'waiting':
        return 'border-red-500';
      case 'awake':
        return 'border-yellow-500';
      case 'ready':
        return 'border-green-500';
      default:
        return 'border-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return <Moon className="w-5 h-5 inline-block mr-2" />;
      case 'awake':
        return <Sunrise className="w-5 h-5 inline-block mr-2" />;
      case 'ready':
        return <Map className="w-5 h-5 inline-block mr-2" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 inline-block mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-x"></div>
      <div className="relative text-center z-10">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className={`w-24 h-24 border-t-4 border-b-4 rounded-full animate-spin ${getTrafficLightColor()}`}></div>
          <TrainFront className="w-12 h-12 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">
          Tubeulator is coming
        </h2>
        <p className="text-xl text-white mb-2">
          It's time for the tubeulator...
        </p>
        <p className="text-sm text-white flex items-center justify-center">
          {getStatusIcon()}
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSplashScreen;
