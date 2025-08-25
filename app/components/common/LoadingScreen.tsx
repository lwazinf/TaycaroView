import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mb-8">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
            <FontAwesomeIcon icon={faChartLine} className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">TaycaroView</h2>
        </div>
        <div className="flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-3 text-xl" />
          <span className="text-gray-600">Loading your account...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;