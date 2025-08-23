import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';

interface CourseListProps {
  semesterId: number;
}

const CourseList: React.FC<CourseListProps> = ({ semesterId }) => {
  const { 
    courses, 
    selectedCourses, 
    isLoading, 
    error, 
    fetchCourses,
    toggleCourseSelection,
    selectAllCourses,
    clearSelection,
    clearError
  } = useCourseStore();

  useEffect(() => {
    fetchCourses(semesterId);
  }, [semesterId, fetchCourses]);

  const handleSelectAll = () => {
    if (selectedCourses.length === getAvailableCourses().length) {
      clearSelection();
    } else {
      selectAllCourses();
    }
  };

  const getAvailableCourses = () => {
    return courses.filter(course => course.status !== 'registered' && course.status !== 'full');
  };

  const isEnrolled = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course?.status === 'registered';
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={clearError}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const availableCourses = getAvailableCourses();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Available Courses</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {selectedCourses.length} of {availableCourses.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {selectedCourses.length === availableCourses.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {availableCourses.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No available courses found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availableCourses.map((course) => {
              const isSelected = selectedCourses.includes(course.id);
              const enrolled = isEnrolled(course.id);
              
              return (
                <div key={course.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !enrolled && toggleCourseSelection(course.id)}
                      disabled={enrolled}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {course.subjectName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Code: {course.subjectCode} • Credits: {course.numberOfCredit}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {enrolled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Enrolled
                            </span>
                          )}
                          {course.status === 'full' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Full
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
