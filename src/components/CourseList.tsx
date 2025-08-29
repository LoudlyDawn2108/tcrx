import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import type { CourseSubjectDto, SubjectRegistrationDto } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface CourseListProps {
  semesterId: number;
}

const CourseList: React.FC<CourseListProps> = ({ semesterId }) => {
  const { 
    selectedCourses,
    selectedSubjectId,
    isLoading, 
    error, 
    fetchCourses,
    toggleCourseSelection,
    clearError,
    coursesData,
    setSelectedSubject
  } = useCourseStore();

  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchCourses(semesterId, user.person.id);
    }
  }, [semesterId, fetchCourses, user]);

  // Get subjects from the course data
  const getSubjects = (): SubjectRegistrationDto[] => {
    if (!coursesData?.courseRegisterViewObject?.listSubjectRegistrationDtos) {
      return [];
    }
    return coursesData.courseRegisterViewObject.listSubjectRegistrationDtos;
  };

  // Get course subjects for the selected subject with hierarchy
  const getModuleClasses = (subjectId: number): (CourseSubjectDto & { isMainClass?: boolean; parentId?: number })[] => {
    const subjects = getSubjects();
    const selectedSubject = subjects.find(s => s.id === subjectId);
    if (!selectedSubject) return [];

    const hierarchicalCourses: (CourseSubjectDto & { isMainClass?: boolean; parentId?: number })[] = [];
    
    selectedSubject.courseSubjectDtos.forEach(courseSubject => {
      // If it has sub-courses, show the main class and its components
      if (courseSubject.subCourseSubjects && courseSubject.subCourseSubjects.length > 0) {
        // Add the main class
        hierarchicalCourses.push({
          ...courseSubject,
          isMainClass: true
        });
        
        // Add the component layers (sub-courses)
        courseSubject.subCourseSubjects.forEach(subCourse => {
          hierarchicalCourses.push({
            ...subCourse,
            isMainClass: false,
            parentId: courseSubject.id
          });
        });
      } else {
        // Regular course without sub-courses
        hierarchicalCourses.push(courseSubject);
      }
    });

    return hierarchicalCourses;
  };

  const subjects = getSubjects();
  const moduleClasses = selectedSubjectId ? getModuleClasses(selectedSubjectId) : [];

  // Auto-select first subject when data loads
  useEffect(() => {
    if (subjects.length > 0 && selectedSubjectId === null) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubjectId, setSelectedSubject]);

  const isCourseFull = (course: CourseSubjectDto) => {
    return course.isFullClass || course.numberStudent >= course.maxStudent;
  };

  const getRegisteredCount = (subjectId: number): number => {
    const classes = getModuleClasses(subjectId);
    // Only count component layers and regular courses, not main classes
    return classes.filter(course => !course.isMainClass && course.isSelected).length;
  };

  const getTotalCount = (subjectId: number): number => {
    const classes = getModuleClasses(subjectId);
    // Only count component layers and regular courses, not main classes
    return classes.filter(course => !course.isMainClass).length;
  };

  const hasSelectedCourse = (subjectId: number): boolean => {
    const classes = getModuleClasses(subjectId);
    const subjectCourseIds = classes.filter(course => !course.isMainClass).map(course => course.id);
    return selectedCourses.some(courseId => subjectCourseIds.includes(courseId));
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
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-medium text-gray-900">Course Registration</h2>
            <button
              onClick={() => fetchCourses(semesterId, user!.person.id)}
              disabled={isLoading}
              className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh course data"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <span className="text-sm text-gray-500">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      </div>

      {/* Two-panel layout - responsive */}
      <div className="flex flex-col lg:flex-row lg:min-h-[600px]">
        {/* Left Panel - Subjects */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Subject</h3>
          </div>
          <div className="overflow-y-auto h-full lg:h-[calc(600px-48px)]">
            {subjects.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No subjects found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {subjects.map((subject) => {
                  const registeredCount = getRegisteredCount(subject.id);
                  const totalCount = getTotalCount(subject.id);
                  const isSelected = selectedSubjectId === subject.id;
                  const hasSelection = hasSelectedCourse(subject.id);
                  
                  return (
                    <div
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={registeredCount > 0 || hasSelection}
                          readOnly
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-900'}`}>
                            {subject.subjectName}
                            {hasSelection && !registeredCount && (
                              <span className="ml-2 text-xs text-blue-600">• Selected</span>
                            )}
                          </p>
                            <p className="text-xs text-gray-500">
                              {totalCount} classes
                            </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Module Classes */}
        <div className="flex-1">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Module Classes</h3>
              {selectedSubjectId && (
                <span className="text-xs text-gray-500">Choose one class</span>
              )}
            </div>
          </div>
          <div className="overflow-y-auto h-full lg:h-[calc(600px-48px)]">
            {!selectedSubjectId ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Select a subject to view module classes
              </div>
            ) : moduleClasses.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No module classes found for this subject
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {moduleClasses.map((course) => {
                  const isSelected = selectedCourses.includes(course.id);
                  const enrolled = course.isSelected;
                  const isFull = isCourseFull(course);
                  const isSelectable = !enrolled && !isFull && !course.isMainClass; // Main classes are not selectable
                  const isMainClass = course.isMainClass;
                  const isComponentLayer = !isMainClass && course.parentId;
                  
                  return (
                    <div key={course.id} 
                      className={`
                        ${isMainClass ? 'bg-gray-100' : enrolled ? 'bg-green-50' : ''}
                        ${isComponentLayer ? 'ml-2 lg:ml-4 border-l-2 border-gray-300' : ''}
                        px-3 lg:px-4 py-3 hover:bg-gray-50
                      `} 
                      onClick={() => isSelectable && selectedSubjectId && toggleCourseSelection(course.id, selectedSubjectId)}>
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex items-start space-x-3 flex-1" >
                          {/* Radio button - only for component layers and regular courses */}
                          {!isMainClass && (
                            <input
                              type="radio"
                              name={`subject-${selectedSubjectId}`}
                              checked={isSelected}
                              onChange={() => {}}
                              disabled={!isSelectable}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 disabled:opacity-50 shrink-0"
                            />
                          )}
                          
                          {/* Main class indicator */}
                          {isMainClass && (
                            <div className="mt-1 w-4 h-4 flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                          )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                            <div className="flex-1">
                              {/* Course title */}
                              <p className={`text-sm font-medium ${
                                isMainClass ? 'text-gray-800 font-semibold' : 
                                enrolled ? 'text-green-900' : 'text-gray-900'
                              }`}>
                                {isMainClass ? 'Main Class: ' : ''}
                                {course.displayName || course.code}
                                {enrolled && <span className="ml-2 text-green-600">✓</span>}
                                {isMainClass && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({course.subCourseSubjects?.length || 0} components)
                                  </span>
                                )}
                                {isFull && !enrolled && !isMainClass && (
                                  <span className="ml-2 text-xs text-red-600 font-medium">THE CLASS IS FULL</span>
                                )}
                              </p>
                              
                              {/* Course details*/}
                                <div className="mt-1 text-xs text-gray-500 space-y-1">
                                  {course.timetables && course.timetables.length > 0 && (
                                    <div className="space-y-1">
                                      {course.timetables.map((timetable, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 text-xs">
                                          <span>
                                            <strong>Week:</strong> {timetable.fromWeek} → {timetable.toWeek} <br/> ({timetable.startDate ? new Date(timetable.startDate).toLocaleDateString() : 'N/A'} - {timetable.endDate ? new Date(timetable.endDate).toLocaleDateString() : 'N/A'})
                                          </span>
                                          <span>
                                            <strong>Thứ: {timetable.weekIndex}</strong> {timetable.start} → {timetable.end} <br/> {timetable.startHour?.startString} → {timetable.endHour?.endString}
                                          </span>
                                          <span>
                                            <strong>Room:</strong> {timetable.room?.code || 'TBA'}
                                          </span>
                                          <span>
                                            <strong>Teacher:</strong> {timetable.teacher?.displayName || course.teacherName || 'TBA'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex flex-col sm:flex-row sm:justify-between text-xs space-y-1 sm:space-y-0">
                                    <span>Students: {course.numberStudent}/{course.maxStudent}</span>
                                  </div>
                                </div>

                            </div>
                            
                            {/* Status badges */}
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-0 sm:ml-4 mt-2 sm:mt-0">
                              {enrolled && !isMainClass && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Registered
                                </span>
                              )}
                              {isFull && !enrolled && !isMainClass && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Full
                                </span>
                              )}
                              {!enrolled && !isFull && !isMainClass && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Available
                                </span>
                              )}
                            </div>
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
      </div>
    </div>
  );
};

export default CourseList;
