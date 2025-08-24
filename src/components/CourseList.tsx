import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import type { CourseSubjectDto } from '../services/api';

interface CourseListProps {
  semesterId: number;
}

const CourseList: React.FC<CourseListProps> = ({ semesterId }) => {
  const { 
    selectedCourses, 
    isLoading, 
    error, 
    fetchCourses,
    toggleCourseSelection,
    selectAllCourses,
    clearSelection,
    clearError,
    getAvailableCourseSubjects
  } = useCourseStore();

  useEffect(() => {
    fetchCourses(semesterId);
  }, [semesterId, fetchCourses]);

  const availableCourses = getAvailableCourseSubjects();

  const handleSelectAll = () => {
    const selectableCourses = availableCourses.filter(course => !isEnrolled(course.id) && !isCourseFull(course));
    if (selectedCourses.length === selectableCourses.length) {
      clearSelection();
    } else {
      selectAllCourses();
    }
  };

  const isEnrolled = (courseId: number) => {
    const course = availableCourses.find(c => c.id === courseId);
    return course?.check === true; // Use the check flag to determine if registered
  };

  const isCourseFull = (course: CourseSubjectDto) => {
    return course.isFullClass || course.numberStudent >= course.maxStudent;
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Available Courses</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {selectedCourses.length} of {availableCourses.filter(course => !isEnrolled(course.id) && !isCourseFull(course)).length} selectable courses
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {selectedCourses.length === availableCourses.filter(course => !isEnrolled(course.id) && !isCourseFull(course)).length ? 'Deselect All' : 'Select All Available'}
            </button>
          </div>
        </div>
        
        {/* Course Statistics */}
        <div className="mt-3 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-green-100 rounded-full"></span>
            <span className="text-gray-600">
              Registered: {availableCourses.filter(course => course.check).length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-blue-100 rounded-full"></span>
            <span className="text-gray-600">
              Available: {availableCourses.filter(course => !course.check && !isCourseFull(course)).length}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-red-100 rounded-full"></span>
            <span className="text-gray-600">
              Full: {availableCourses.filter(course => isCourseFull(course)).length}
            </span>
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
              const isFull = isCourseFull(course);
              const isSelectable = !enrolled && !isFull;
              
              return (
                <div key={course.id} className={`px-6 py-4 hover:bg-gray-50 ${enrolled ? 'bg-green-50' : ''}`}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => isSelectable && toggleCourseSelection(course.id)}
                      disabled={!isSelectable}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${enrolled ? 'text-green-900' : 'text-gray-900'}`}>
                            {course.displayName || course.subjectName || 'Unnamed Course'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Code: {course.code || course.subjectCode} • Credits: {course.numberOfCredit}
                          </p>
                          {course.teacherName && (
                            <p className="text-xs text-gray-400">
                              Teacher: {course.teacherName}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                            <span>Students: {course.numberStudent}/{course.maxStudent}</span>
                            {course.timetables && course.timetables.length > 0 && (
                              <span>
                                Schedule: {course.timetables.map(t => `Week ${t.weekIndex}`).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {enrolled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Registered
                            </span>
                          )}
                          {isFull && !enrolled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Full
                            </span>
                          )}
                          {!enrolled && !isFull && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Available
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
