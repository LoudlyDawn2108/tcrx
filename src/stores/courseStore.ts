import { create } from 'zustand';
import type { SemesterPeriodData, CourseSubjectDto } from '../services/api';
import apiService from '../services/api';
import { useRegistrationStore } from './registrationStore';
import { useLogStore } from './logStore';

interface CourseState {
  coursesData: SemesterPeriodData | null;
  selectedCourses: number[];
  selectedSubjectId: number | null;
  isLoading: boolean;
  error: string | null;
  abortController: AbortController | null;
  
  // Actions
  fetchCourses: (registrationPeriodId: number, personId: number) => Promise<void>;
  toggleCourseSelection: (courseId: number, subjectId: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  setSelectedSubject: (subjectId: number | null) => void;
  abortRequests: () => void;
  
  // Helper getters
  getAvailableCourseSubjects: () => CourseSubjectDto[];
  getModuleClassesForSubject: (subjectId: number) => CourseSubjectDto[];
  getSelectedCourseForSubject: (subjectId: number) => number | null;
  getCourseObjectById: (courseId: number) => CourseSubjectDto | undefined;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  coursesData: null,
  selectedCourses: [],
  selectedSubjectId: null,
  isLoading: false,
  error: null,
  abortController: null,

  fetchCourses: async (registrationPeriodId: number, personId: number) => {
    // Abort any existing request
    const { abortController: existingController } = get();
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    set({ isLoading: true, error: null, abortController });
    
    const logStore = useLogStore.getState();
    const maxRetries = 100;
    const logEntryId = logStore.addLogEntry({
      courseId: 0,
      courseCode: registrationPeriodId.toString(),
      courseName: 'Fetching available courses...',
      message: '',
      status: 'pending',
    });

    try {
      const coursesData = await apiService.getAvailableCourses(registrationPeriodId, personId, {
        signal: abortController.signal,
        onRetry: (retryCount) => {
          logStore.updateLogEntry(logEntryId, {
            status: 'retrying',
            message: `Retrying... (Attempt ${retryCount}/${maxRetries})`,
            retryAttempt: retryCount,
            maxRetries,
          });
        }
      });
      
      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        set({ 
          coursesData,
          isLoading: false,
          abortController: null
        });

        logStore.updateLogEntry(logEntryId, {
          status: 'success',
          courseName: `Fetched ${coursesData.courseRegisterViewObject?.listSubjectRegistrationDtos?.length || 0} subjects`,
          message: 'Successfully fetched available courses!',
        });

        // Update registration times from API data
        const registrationTimes = coursesData.courseRegisterViewObject;
        if (registrationTimes && registrationTimes.startDate && registrationTimes.endDate) {
          const registrationStore = useRegistrationStore.getState();
          registrationStore.updateRegistrationTimes(registrationTimes.startDate, registrationTimes.endDate);
          registrationStore.setSemesterPeriod(registrationPeriodId);
        }
      }
    } catch (error) {
      // Don't set error if request was cancelled
      if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') {
        console.log('Course request was cancelled');
        logStore.updateLogEntry(logEntryId, {
          status: 'failed',
          courseName: 'Course fetch cancelled',
          message: 'Request was canceled',
        });
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courses';
      
      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        logStore.updateLogEntry(logEntryId, {
          status: 'failed',
          courseName: 'Course fetch failed',
          message: errorMessage,
        });

        set({ 
          error: errorMessage,
          isLoading: false,
          abortController: null
        });
      }
    }
  },

  abortRequests: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ 
        abortController: null,
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

  // Helper: Lấy object lớp học phần đầy đủ từ coursesData theo id
  getCourseObjectById: (courseId: number) => {
    const { getAvailableCourseSubjects } = get();
    const availableCourses = getAvailableCourseSubjects();
    return availableCourses.find(course => course.id === courseId);
  },
}));
