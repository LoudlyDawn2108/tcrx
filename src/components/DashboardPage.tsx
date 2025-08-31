import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSemesterStore } from '../stores/semesterStore';
import { useRequestCleanup } from '../hooks/useRequestCleanup';
import { useSessionHandler } from '../hooks/useSessionHandler';
import CourseList from './CourseList';
import RegistrationControls from './RegistrationControls';
import LogView from './LogView';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { currentSemester, loading: semesterLoading, error: semesterError, fetchCurrentSemester } = useSemesterStore();
  
  // State for selected registration period
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  // Clean up any ongoing requests when component unmounts (e.g., on logout)
  useRequestCleanup();

  // Handle session expiration from API
  useSessionHandler();

  useEffect(() => {
    // Fetch current semester info on load
    fetchCurrentSemester();
  }, [fetchCurrentSemester]);

  // Set default period when semester data is loaded
  useEffect(() => {
    if (currentSemester && currentSemester.semesterRegisterPeriods.length > 0 && selectedPeriodId === null) {
      // Set the first period as default
      setSelectedPeriodId(currentSemester.semesterRegisterPeriods[0].id);
    }
  }, [currentSemester, selectedPeriodId]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const periodId = parseInt(event.target.value);
    setSelectedPeriodId(periodId);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                TLU Course Registration
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Modern client with intelligent retry and bulk registration
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.username} • {user.email}
                  </p>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Semester Information */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Semester</h2>
              
              {semesterLoading && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Loading semester information...</span>
                </div>
              )}
              
              {semesterError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error loading semester information
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{semesterError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentSemester && !semesterLoading && (
                <div className="space-y-4">
                  {/* Registration Period Selector */}
                  {currentSemester.semesterRegisterPeriods.length > 0 && (
                    <div>
                      <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Registration Period:
                      </label>
                      <select
                        id="period-select"
                        value={selectedPeriodId || ''}
                        onChange={handlePeriodChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select a period...</option>
                        {currentSemester.semesterRegisterPeriods.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.name} ({period.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Semester Information Grid */}
                  <div className="grid grid-cols-1  lg:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                      <p className="mt-1 text-sm text-gray-900">{currentSemester.semesterName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Period</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(currentSemester.startDate).toLocaleDateString()} - {new Date(currentSemester.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Course List */}
            <div className="lg:col-span-2">
              {selectedPeriodId ? (
                <CourseList semesterId={selectedPeriodId} />
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="text-center text-gray-500">
                    <p>Please select a registration period to view available courses.</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Controls and Log */}
            <div className="space-y-6">
              {selectedPeriodId ? (
                <RegistrationControls semesterId={selectedPeriodId} registrationPeriodId={selectedPeriodId} />
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="text-center text-gray-500">
                    <p>Select a registration period to enable controls.</p>
                  </div>
                </div>
              )}
              <LogView />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Modern TLU Course Registration Client • Built with intelligent retry and bulk registration features
            </p>
            <p className="mt-1">
              Features automatic retry on failures, bulk course registration, and pre-registration queuing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
