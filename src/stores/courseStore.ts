import { create } from 'zustand';
import type { SemesterPeriodData, CourseSubjectDto } from '../services/api';
import apiService from '../services/api';

interface CourseState {
  coursesData: SemesterPeriodData | null;
  selectedCourses: number[];
  selectedSubjectId: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCourses: (registrationPeriodId: number, personId: number) => Promise<void>;
  toggleCourseSelection: (courseId: number, subjectId: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  setSelectedSubject: (subjectId: number | null) => void;
  
  // Helper getters
  getAvailableCourseSubjects: () => CourseSubjectDto[];
  getModuleClassesForSubject: (subjectId: number) => CourseSubjectDto[];
  getSelectedCourseForSubject: (subjectId: number) => number | null;
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

  getSelectedCourseForSubject: (subjectId: number) => {
    const { selectedCourses, coursesData } = get();
    if (!coursesData?.courseRegisterViewObject?.listSubjectRegistrationDtos) return null;
    
    const subject = coursesData.courseRegisterViewObject.listSubjectRegistrationDtos.find(s => s.id === subjectId);
    if (!subject) return null;

    // Find which course in this subject is selected
    const subjectCourseIds: number[] = [];
    subject.courseSubjectDtos.forEach(courseSubject => {
      if (courseSubject.subCourseSubjects && courseSubject.subCourseSubjects.length > 0) {
        subjectCourseIds.push(...courseSubject.subCourseSubjects.map(sc => sc.id));
      } else {
        subjectCourseIds.push(courseSubject.id);
      }
    });

    return selectedCourses.find(courseId => subjectCourseIds.includes(courseId)) || null;
  },

  toggleCourseSelection: (courseId: number, subjectId: number) => {
    const { selectedCourses, getSelectedCourseForSubject } = get();
    const currentSelectedInSubject = getSelectedCourseForSubject(subjectId);
    
    if (currentSelectedInSubject === courseId) {
      // Deselect the current course
      set({ 
        selectedCourses: selectedCourses.filter(id => id !== courseId)
      });
    } else {
      // Select new course and deselect any previously selected course in this subject
      const newSelectedCourses = [...selectedCourses.filter(id => id !== currentSelectedInSubject), courseId];
      set({ 
        selectedCourses: newSelectedCourses
      });
    }
  },

  clearSelection: () => {
    set({ selectedCourses: [] });
  },

  clearError: () => set({ error: null }),
}));
