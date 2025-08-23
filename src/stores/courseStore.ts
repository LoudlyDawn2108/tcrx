import { create } from 'zustand';
import type { Course } from '../services/api';
import apiService from '../services/api';

interface CourseState {
  courses: Course[];
  selectedCourses: number[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: (registrationPeriodId: number) => Promise<void>;
  toggleCourseSelection: (courseId: number) => void;
  selectAllCourses: () => void;
  clearSelection: () => void;
  clearError: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  selectedCourses: [],
  isLoading: false,
  error: null,

  fetchCourses: async (registrationPeriodId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const courses = await apiService.getAvailableCourses(registrationPeriodId);
      set({ 
        courses: [courses].map(course => ({ ...course, isSelected: false })),
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
    const { courses } = get();
    const availableCourseIds = courses
      .filter(course => course.status !== 'registered' && course.status !== 'full')
      .map(course => course.id);
    
    set({ selectedCourses: availableCourseIds });
  },

  clearSelection: () => {
    set({ selectedCourses: [] });
  },

  clearError: () => set({ error: null }),
}));
