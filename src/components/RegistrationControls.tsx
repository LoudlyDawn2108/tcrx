import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import { useRegistrationStore, REGISTRATION_START_TIME, REGISTRATION_END_TIME, USE_TEST_TIMES } from '../stores/registrationStore';
import { useAuthStore } from '../stores/authStore';

interface RegistrationControlsProps {
  semesterId: number;
}

interface RegistrationControlsProps {
  semesterId: number;
  registrationPeriodId?: number;
}

const RegistrationControls: React.FC<RegistrationControlsProps> = ({ registrationPeriodId }) => {
  const { user } = useAuthStore();
  const { selectedCourses, clearSelection, getAvailableCourseSubjects } = useCourseStore();
  const { 
    queue,
    registrationTimeStatus,
    status,
    timeUntilStart,
    timeUntilEnd,
    registrationStartTime,
    registrationEndTime,
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

  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRegistrationStatusInfo = () => {
    let currentStartTime = registrationStartTime || REGISTRATION_START_TIME;
    let currentEndTime = registrationEndTime || REGISTRATION_END_TIME;
    if (USE_TEST_TIMES) {
      currentStartTime = REGISTRATION_START_TIME;
      currentEndTime = REGISTRATION_END_TIME;
    }
    
    switch (registrationTimeStatus) {
      case 'waiting':
        return {
          color: 'yellow',
          text: 'Registration opens in:',
          time: formatTime(timeUntilStart),
          details: `Start time: ${currentStartTime.toLocaleString()}`,
          icon: '⏳'
        };
      case 'open':
        return {
          color: 'green',
          text: 'Registration is OPEN - Ends in:',
          time: formatTime(timeUntilEnd),
          details: `End time: ${currentEndTime.toLocaleString()}`,
          icon: '✅'
        };
      case 'ended':
        return {
          color: 'red',
          text: 'Registration has ENDED',
          time: '',
          details: `Ended at: ${currentEndTime.toLocaleString()}`,
          icon: '❌'
        };
      default:
        return {
          color: 'gray',
          text: 'Loading registration status...',
          time: '',
          details: '',
          icon: '⏱️'
        };
    }
  };

  const handleRegisterNow = async () => {
    if (!hasSelection || !user || !registrationPeriodId) return;
    await startRegistrationProcess(selectedCoursesData, user.person.id, registrationPeriodId);
    clearSelection();
  };

  const handleAddToQueue = () => {
    if (!hasSelection) return;
    
    addToQueue(selectedCoursesData);
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
        {(() => {
          const statusInfo = getRegistrationStatusInfo();
          return (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  statusInfo.color === 'green' ? 'bg-green-400' :
                  statusInfo.color === 'yellow' ? 'bg-yellow-400' :
                  statusInfo.color === 'red' ? 'bg-red-400' :
                  'bg-gray-400'
                }`}></div>
                <span className={`text-sm font-medium ${
                  statusInfo.color === 'green' ? 'text-green-700' :
                  statusInfo.color === 'yellow' ? 'text-yellow-700' :
                  statusInfo.color === 'red' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  <span className="mr-2">{statusInfo.icon}</span>
                  {statusInfo.text}
                </span>
              </div>
              {statusInfo.time && (
                <div className="text-2xl font-mono font-bold text-gray-900">
                  {statusInfo.time}
                </div>
              )}
              {statusInfo.details && (
                <div className="text-xs text-gray-500">
                  {statusInfo.details}
                </div>
              )}
              {USE_TEST_TIMES && (
                <div className="text-xs text-blue-500 font-medium">
                  ⚠️ Using test times for development
                </div>
              )}
            </div>
          );
        })()}
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
        {registrationTimeStatus === 'open' ? (
          <button
            onClick={handleRegisterNow}
            disabled={!hasSelection || isProcessing}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Register Selected Courses'}
          </button>
        ) : registrationTimeStatus === 'waiting' ? (
          <button
            onClick={handleAddToQueue}
            disabled={!hasSelection}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add to Registration Queue
          </button>
        ) : (
          <div className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50">
            Registration Period Has Ended
          </div>
        )}
        
        {hasSelection && registrationTimeStatus !== 'ended' && (
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
            <ul className="text-xs text-gray-700 mb-2">
              {queue.map((item) => (
                <li key={item.subjectId} className="mb-1">
                  <span className="font-semibold">{item.displayName}</span>
                  <span className="text-gray-400"> (Mã: {item.code})</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-600">
              {queue.length} subject{queue.length !== 1 ? 's' : ''} queued for automatic registration
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
