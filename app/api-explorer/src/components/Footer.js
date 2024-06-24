import React from 'react';
import { Bug } from 'lucide-react';

const Footer = ({ toggleDebugMode }) => {
  return (
    <footer className="mt-8 text-center text-gray-600 relative">
      <p>© 2024 Louis Maddox : : <a href="https://spin.systems">spin.systems</a></p>
      <button 
        onClick={toggleDebugMode}
        className="absolute bottom-0 right-0 p-2 text-gray-500 hover:text-gray-700"
        aria-label="Toggle Debug Mode"
      >
        <Bug size={24} />
      </button>
    </footer>
  );
};

export default Footer;
