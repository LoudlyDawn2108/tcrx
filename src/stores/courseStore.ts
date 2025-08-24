import { create } from 'zustand';
import type { Courses, CourseSubjectDto } from '../services/api';
import apiService from '../services/api';

interface CourseState {
  coursesData: Courses | null;
  selectedCourses: number[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: (registrationPeriodId: number) => Promise<void>;
  toggleCourseSelection: (courseId: number) => void;
  selectAllCourses: () => void;
  clearSelection: () => void;
  clearError: () => void;
  
  // Helper getters
  getAvailableCourseSubjects: () => CourseSubjectDto[];
}

export const useCourseStore = create<CourseState>((set, get) => ({
  coursesData: null,
  selectedCourses: [],
  isLoading: false,
  error: null,

  fetchCourses: async (registrationPeriodId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const coursesData = await apiService.getAvailableCourses(registrationPeriodId);
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
    const { getAvailableCourseSubjects } = get();
    const availableCourses = getAvailableCourseSubjects();
    const availableCourseIds = availableCourses
      .filter(course => !course.isFullClass && !course.check) // Exclude full classes and already registered courses
      .map(course => course.id);
    
    set({ selectedCourses: availableCourseIds });
  },

  clearSelection: () => {
    set({ selectedCourses: [] });
  },

  clearError: () => set({ error: null }),
}));
