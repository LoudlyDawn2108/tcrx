import React, { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import type { CourseSubjectDto, SubjectRegistrationDto } from '../services/api';

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
    selectAllCourses,
    clearSelection,
    clearError,
    coursesData,
    setSelectedSubject
  } = useCourseStore();

  useEffect(() => {
    fetchCourses(semesterId);
  }, [semesterId, fetchCourses]);

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

  const isEnrolled = (courseId: number) => {
    const course = moduleClasses.find(c => c.id === courseId);
    return course?.isSelected === true; // Use the check flag to determine if registered
  };

  const isCourseFull = (course: CourseSubjectDto) => {
    return course.isFullClass || course.numberStudent >= course.maxStudent;
  };

  const handleSelectAll = () => {
    // Only consider component layers and regular courses for selection, not main classes
    const selectableCourses = moduleClasses.filter(course => 
      !course.isMainClass && !isEnrolled(course.id) && !isCourseFull(course)
    );
    const currentlySelected = selectedCourses.filter(id => 
      moduleClasses.some(course => course.id === id && !course.isMainClass)
    );
    
    if (currentlySelected.length === selectableCourses.length) {
      clearSelection();
    } else {
      selectAllCourses();
    }
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Course Registration</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
            </span>
            {selectedSubjectId && (
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {selectedCourses.filter(id => 
                  moduleClasses.some(course => course.id === id && !course.isMainClass)
                ).length === moduleClasses.filter(course => 
                  !course.isMainClass && !isEnrolled(course.id) && !isCourseFull(course)
                ).length ? 'Deselect All' : 'Select All Available'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex" style={{ height: '500px' }}>
        {/* Left Panel - Subjects */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Subject</h3>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(500px - 48px)' }}>
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
                          checked={registeredCount > 0}
                          readOnly
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isSelected ? 'font-medium text-blue-900' : 'text-gray-900'}`}>
                            {subject.subjectName}
                          </p>
                          {registeredCount > 0 && (
                            <p className="text-xs text-gray-500">
                              {registeredCount}/{totalCount} registered
                            </p>
                          )}
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
                <span className="text-xs text-gray-500">
                  {moduleClasses.filter(c => !c.isMainClass && c.check).length}/{moduleClasses.filter(c => !c.isMainClass).length} registered
                </span>
              )}
            </div>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(500px - 48px)' }}>
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
                  const enrolled = isEnrolled(course.id);
                  const isFull = isCourseFull(course);
                  const isSelectable = !enrolled && !isFull && !course.isMainClass; // Main classes are not selectable
                  const isMainClass = course.isMainClass;
                  const isComponentLayer = !isMainClass && course.parentId;
                  
                  return (
                    <div key={course.id} className={`
                      ${isMainClass ? 'bg-gray-100' : enrolled ? 'bg-green-50' : ''}
                      ${isComponentLayer ? 'ml-4 border-l-2 border-gray-300' : ''}
                      px-4 py-3 hover:bg-gray-50
                    `}>
                      <div className="flex items-start space-x-3">
                        {/* Checkbox - only for component layers and regular courses */}
                        {!isMainClass && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => isSelectable && toggleCourseSelection(course.id)}
                            disabled={!isSelectable}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                          />
                        )}
                        
                        {/* Main class indicator */}
                        {isMainClass && (
                          <div className="mt-1 w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
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
                              
                              {/* Component layer header */}
                              {isComponentLayer && (
                                <p className="text-xs text-gray-600 italic mb-1">Component Layers:</p>
                              )}
                              
                              {/* Course details - only for non-main classes or when main class has no sub-courses */}
                              {(!isMainClass || !course.subCourseSubjects?.length) && (
                                <div className="mt-1 text-xs text-gray-500 space-y-1">
                                  {course.timetables && course.timetables.length > 0 && (
                                    <div className="space-y-1">
                                      {course.timetables.map((timetable, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-4 text-xs">
                                          <span>
                                            <strong>Week:</strong> {timetable.fromWeek} → ({timetable.startDate ? new Date(timetable.startDate).toLocaleDateString() : 'N/A'} {timetable.endDate ? new Date(timetable.endDate).toLocaleDateString() : 'N/A'} →)
                                          </span>
                                          <span>
                                            <strong>Time:</strong> {timetable.startHour?.indexNumber || 'N/A'}th . Period {timetable.startHour?.indexNumber || 'N/A'} Period {timetable.endHour?.indexNumber || 'N/A'} →
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
                                  <div className="flex justify-between text-xs">
                                    <span>Students: {course.numberStudent}/{course.maxStudent}</span>
                                    <span>Credits: {course.numberOfCredit}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Status badges */}
                            <div className="flex items-center space-x-2 ml-4">
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
                              {isMainClass && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {course.numberStudent}/{course.maxStudent}
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
      </div>
    </div>
  );
};

export default CourseList;
