import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseSubjectDto } from '../services/api';
import apiService from '../services/api';
import { useLogStore } from './logStore';
import { useAuthStore } from './authStore';

// Configuration - for testing purposes
export const USE_TEST_TIMES = false; // Set to true to use test times instead of API times
export const REGISTRATION_START_TIME = new Date(Date.now() + 1 * 80 * 1000); // Test start time
export const REGISTRATION_END_TIME = new Date('2025-08-29T23:59:59'); // Test end time

export type RegistrationStatus = 'idle' | 'processing_queue' | 'processing_manual';
export type RegistrationTimeStatus = 'waiting' | 'open' | 'ended';


interface RegistrationState {
  queue: CourseSubjectDto[];
  isRegistrationOpen: boolean;
  registrationTimeStatus: RegistrationTimeStatus;
  status: RegistrationStatus;
  currentSemesterPeriodId: number;
  timeUntilStart: number; // milliseconds
  timeUntilEnd: number; // milliseconds
  registrationStartTime: Date | null; // From API or test constants
  registrationEndTime: Date | null; // From API or test constants
  
  // Actions
  addToQueue: (courses: CourseSubjectDto[]) => void;
  clearQueue: () => void;
  startRegistrationProcess: (courses?: CourseSubjectDto[], personId?: number, registrationPeriodId?: number) => Promise<void>;
  checkRegistrationTime: () => void;
  updateRegistrationTimes: (startTime?: number, endTime?: number) => void;
  setSemesterPeriod: (semesterId: number) => void;
  
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      queue: [],
      isRegistrationOpen: false,
      registrationTimeStatus: 'waiting',
      status: 'idle',
      currentSemesterPeriodId: 13, // Default semester, should be configurable
      timeUntilStart: 0,
      timeUntilEnd: 0,
      registrationStartTime: null,
      registrationEndTime: null,

      addToQueue: (courses) => {
        const { queue } = get();
        const subjectMap = new Map<number, CourseSubjectDto>();

        courses.forEach(course => {
          const subjectId = course.subjectId;
          subjectMap.set(subjectId, course);
        });

        // Lọc queue cũ, bỏ các subjectId đã có trong subjectMap
        const filteredQueue = queue.filter(q => !subjectMap.has(q.subjectId));
        const newQueuedCourses = Array.from(subjectMap.values());

        set({ queue: [...filteredQueue, ...newQueuedCourses] })
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      startRegistrationProcess: async (courses, personId, registrationPeriodId) => {
        console.log('[REG-PROCESS] Called startRegistrationProcess', { courses, personId, registrationPeriodId });
        const state = get();
        const logStore = useLogStore.getState();
        const maxRetries = 10;
        if (!personId || !registrationPeriodId) {
          throw new Error('personId và registrationPeriodId là bắt buộc khi đăng ký!');
        }

        if (courses && courses.length > 0) {
          set({ status: 'processing_manual' });
          await Promise.all(courses.map(async (course) => {

            const lastLogId = logStore.addLogEntry({
              courseId: course.id,
              courseName: course.displayName || course.subjectName || 'Unknown course',
              courseCode: course.code || course.subjectCode || 'Unknown course',
              status: 'pending',
              message: 'Attempting to register (practical class)...',
            });

            const result = await apiService.registerForCourseFullObject(course, personId, registrationPeriodId, {
              onRetry: (retryCount) => {
                logStore.updateLogEntry(lastLogId, {
                  status: 'retrying',
                  message: `Retrying... (Attempt ${retryCount}/${maxRetries})`,
                  retryAttempt: retryCount,
                  maxRetries: 10,
                });
              }
            });

            if (result.success) {
              logStore.updateLogEntry(lastLogId, {
                status: 'success',
                message: 'Successfully registered for course!',
              });
            } else {
              logStore.updateLogEntry(lastLogId, {
                status: 'failed',
                message: result.message || 'Registration failed',
              });
            }
          }));
        } else {
          const queue = state.queue;
          if (queue.length === 0) return;
          set({ status: 'processing_queue' });
          await Promise.all(queue.map(async (item) => {
              const lastLogId = logStore.addLogEntry({
                courseId: item.id,
                courseName: item.displayName || item.subjectName || 'Unknown course',
                courseCode: item.code || item.subjectCode || 'Unknown course',
                status: 'pending',
                message: 'Attempting to register (practical class)...',
              });

              const result = await apiService.registerForCourseFullObject(item, personId, registrationPeriodId, {
                onRetry: (retryCount) => {
                  logStore.addLogEntry({
                      courseId: item.id,
                      courseName: item.displayName || item.subjectName || 'Unknown course',
                      courseCode: item.code || item.subjectCode || 'Unknown course',
                      status: 'retrying',
                      message: `Retrying... (Attempt ${retryCount}/${maxRetries})`,
                      retryAttempt: retryCount,
                      maxRetries: 10,
                    });
                  }
              });

              if (result.success) {
                logStore.updateLogEntry(lastLogId, {
                  status: 'success',
                  message: 'Successfully registered for course!',
                });
              } else {
                logStore.updateLogEntry(lastLogId, {
                  status: 'failed',
                  message: result.message || 'Registration failed',
                });
              }
            }));

          set({ queue: [] });
        }
        set({ status: 'idle' });
      },

      checkRegistrationTime: () => {
        const state = get();
        const now = new Date();
        
        // Use test times or API times
        let startTime: Date;
        let endTime: Date;
        
        if (USE_TEST_TIMES) {
          startTime = REGISTRATION_START_TIME;
          endTime = REGISTRATION_END_TIME;
        } else if (state.registrationStartTime && state.registrationEndTime) {
          startTime = state.registrationStartTime;
          endTime = state.registrationEndTime;
        } else {
          // Fallback to test times if no API times are available
          startTime = REGISTRATION_START_TIME;
          endTime = REGISTRATION_END_TIME;
        }
        
        const timeUntilStart = startTime.getTime() - now.getTime();
        const timeUntilEnd = endTime.getTime() - now.getTime();
        const isOpen = now >= startTime && now <= endTime;
        
        let registrationTimeStatus: RegistrationTimeStatus;
        if (now < startTime) {
          registrationTimeStatus = 'waiting';
        } else if (now >= startTime && now <= endTime) {
          registrationTimeStatus = 'open';
        } else {
          registrationTimeStatus = 'ended';
        }
        
        
        // Auto-start queue processing when registration opens
        const { queue, status, currentSemesterPeriodId: currentSemesterId } = get();
        const wasRegistrationClosed = !get().isRegistrationOpen;

        set({ 
          isRegistrationOpen: isOpen,
          registrationTimeStatus,
          timeUntilStart: Math.max(0, timeUntilStart),
          timeUntilEnd: Math.max(0, timeUntilEnd)
        });

        if (isOpen && queue.length > 0 && status === 'idle' && wasRegistrationClosed) {
          console.log('[AUTO-REG] Registration time reached! Starting queue processing...');
          const auth = useAuthStore.getState();
          const user = auth.user;
          console.log(user)
          const personId = user?.person?.id;
          const registrationPeriodId = currentSemesterId;
          if (personId && registrationPeriodId) {
            console.log('[AUTO-REG] Starting registration process...', { personId, registrationPeriodId, queue });
            get().startRegistrationProcess(undefined, personId, registrationPeriodId);
          } else {
            console.warn('[AUTO-REG] Missing personId or registrationPeriodId', { personId, registrationPeriodId, user });
          }
        }
      },

      updateRegistrationTimes: (startTime?: number, endTime?: number) => {
        if (startTime && endTime) {
          set({
            registrationStartTime: new Date(startTime),
            registrationEndTime: new Date(endTime)
          });
          // Immediately check registration time with new times
          get().checkRegistrationTime();
        }
      },

      setSemesterPeriod: (semesterId) => {
        set({ currentSemesterPeriodId: semesterId });
      },

      
    }),
    {
      name: 'registration-storage',
      partialize: (state) => ({ 
        queue: state.queue,
        currentSemesterId: state.currentSemesterPeriodId,
        registrationStartTime: state.registrationStartTime,
        registrationEndTime: state.registrationEndTime
      }),
    }
  )
);
