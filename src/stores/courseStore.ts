import { create } from 'zustand';
import type { Courses, CourseSubjectDto } from '../services/api';
import apiService from '../services/api';

interface CourseState {
  coursesData: Courses | null;
  selectedCourses: number[];
  selectedSubjectId: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: (registrationPeriodId: number, personId: number) => Promise<void>;
  toggleCourseSelection: (courseId: number) => void;
  selectAllCourses: () => void;
  clearSelection: () => void;
  clearError: () => void;
  setSelectedSubject: (subjectId: number | null) => void;
  
  // Helper getters
  getAvailableCourseSubjects: () => CourseSubjectDto[];
  getModuleClassesForSubject: (subjectId: number) => CourseSubjectDto[];
}

export const useCourseStore = create<CourseState>((set, get) => ({
  coursesData: null,
  selectedCourses: [],
  selectedSubjectId: null,
  isLoading: false,
  error: null,

  fetchCourses: async (registrationPeriodId: number, personId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const coursesData = await apiService.getAvailableCourses(registrationPeriodId, personId);
      set({ 
        coursesData,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courses';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },

  getAvailableCourseSubjects: () => {
    const { coursesData } = get();
    if (!coursesData?.courseRegisterViewObject?.listSubjectRegistrationDtos) {
      return [];
    }
    
    const allCourseSubjects: CourseSubjectDto[] = [];
    coursesData.courseRegisterViewObject.listSubjectRegistrationDtos.forEach(subject => {
      subject.courseSubjectDtos.forEach(courseSubject => {
        // If it has sub-courses, use those instead
        if (courseSubject.subCourseSubjects && courseSubject.subCourseSubjects.length > 0) {
          allCourseSubjects.push(...courseSubject.subCourseSubjects);
        } else {
          allCourseSubjects.push(courseSubject);
        }
      });
    });
    
    return allCourseSubjects;
  },

  getModuleClassesForSubject: (subjectId: number) => {
    const { coursesData } = get();
    if (!coursesData?.courseRegisterViewObject?.listSubjectRegistrationDtos) {
      return [];
    }
    
    const subject = coursesData.courseRegisterViewObject.listSubjectRegistrationDtos.find(s => s.id === subjectId);
    if (!subject) return [];

    const allCourseSubjects: CourseSubjectDto[] = [];
    subject.courseSubjectDtos.forEach(courseSubject => {
      // If it has sub-courses, use those instead
      if (courseSubject.subCourseSubjects && courseSubject.subCourseSubjects.length > 0) {
        allCourseSubjects.push(...courseSubject.subCourseSubjects);
      } else {
        allCourseSubjects.push(courseSubject);
      }
    });

    return allCourseSubjects;
  },

  setSelectedSubject: (subjectId: number | null) => {
    set({ selectedSubjectId: subjectId });
  },

  toggleCourseSelection: (courseId: number) => {
    const { selectedCourses } = get();
    const isSelected = selectedCourses.includes(courseId);
    
    if (isSelected) {
      set({ 
        selectedCourses: selectedCourses.filter(id => id !== courseId)
      });
    } else {
      set({ 
        selectedCourses: [...selectedCourses, courseId]
      });
    }
  },

  selectAllCourses: () => {
    const { selectedSubjectId, coursesData } = get();
    if (!selectedSubjectId || !coursesData?.courseRegisterViewObject?.listSubjectRegistrationDtos) return;
    
    const subject = coursesData.courseRegisterViewObject.listSubjectRegistrationDtos.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    const selectableCourseIds: number[] = [];
    
    subject.courseSubjectDtos.forEach(courseSubject => {
      // If it has sub-courses, only consider the sub-courses for selection
      if (courseSubject.subCourseSubjects && courseSubject.subCourseSubjects.length > 0) {
        courseSubject.subCourseSubjects.forEach(subCourse => {
          if (!subCourse.isFullClass && !subCourse.check) {
            selectableCourseIds.push(subCourse.id);
          }
        });
      } else {
        // Regular course without sub-courses
        if (!courseSubject.isFullClass && !courseSubject.check) {
          selectableCourseIds.push(courseSubject.id);
        }
      }
    });
    
    set({ selectedCourses: selectableCourseIds });
  },

  clearSelection: () => {
    set({ selectedCourses: [] });
  },

  clearError: () => set({ error: null }),
}));
