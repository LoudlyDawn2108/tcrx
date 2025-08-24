import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import { useRegistrationStore, REGISTRATION_START_TIME } from '../stores/registrationStore';

interface RegistrationControlsProps {
  semesterId: number;
}

const RegistrationControls: React.FC<RegistrationControlsProps> = ({ semesterId }) => {
  const { selectedCourses, clearSelection, getAvailableCourseSubjects } = useCourseStore();
  const { 
    queue,
    isRegistrationOpen,
    status,
    timeUntilStart,
    addToQueue,
    clearQueue,
    startRegistrationProcess,
    checkRegistrationTime
  } = useRegistrationStore();

  // Check registration time every second
  useEffect(() => {
    const interval = setInterval(checkRegistrationTime, 1000);
    return () => clearInterval(interval);
  }, [checkRegistrationTime]);

  const availableCourses = getAvailableCourseSubjects();
  const selectedCoursesData = availableCourses.filter(course => selectedCourses.includes(course.id));
  const hasSelection = selectedCourses.length > 0;
  const isProcessing = status !== 'idle';

  const formatTimeUntilStart = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegisterNow = async () => {
    if (!hasSelection) return;
    
    await startRegistrationProcess(selectedCoursesData, semesterId);
    clearSelection();
  };

  const handleAddToQueue = () => {
    if (!hasSelection) return;
    
    addToQueue(selectedCoursesData, semesterId);
    clearSelection();
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing_queue':
        return 'Processing queued registrations...';
      case 'processing_manual':
        return 'Processing manual registrations...';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Registration Controls</h2>
      
      {/* Registration Status */}
      <div className="mb-6">
        {isRegistrationOpen ? (
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-700">Registration is OPEN</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-yellow-700">Registration opens in:</span>
            </div>
            <div className="text-2xl font-mono font-bold text-gray-900">
              {formatTimeUntilStart(timeUntilStart)}
            </div>
            <div className="text-xs text-gray-500">
              Start time: {REGISTRATION_START_TIME.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium text-blue-700">{getStatusText()}</span>
          </div>
        </div>
      )}

      {/* Selected Courses Info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {hasSelection ? (
            <>
              <span className="font-medium">{selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}</span> selected
            </>
          ) : (
            'No courses selected'
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isRegistrationOpen ? (
          <button
            onClick={handleRegisterNow}
            disabled={!hasSelection || isProcessing}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Register Selected Courses'}
          </button>
        ) : (
          <button
            onClick={handleAddToQueue}
            disabled={!hasSelection}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add to Registration Queue
          </button>
        )}
        
        {hasSelection && (
          <button
            onClick={clearSelection}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Queue Info */}
      {queue.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Registration Queue</h3>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              {queue.length} course{queue.length !== 1 ? 's' : ''} queued for automatic registration
            </p>
            <button
              onClick={clearQueue}
              className="text-xs text-red-600 hover:text-red-500 font-medium"
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationControls;
