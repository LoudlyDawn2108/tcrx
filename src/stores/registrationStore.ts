import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, RegistrationResponse } from '../services/api';
import apiService from '../services/api';
import { useLogStore } from './logStore';

// Configuration - in a real app, this would come from the backend
export const REGISTRATION_START_TIME = new Date('2025-08-25T08:00:00');
export const REGISTRATION_END_TIME = new Date('2025-08-25T23:59:59');

export type RegistrationStatus = 'idle' | 'processing_queue' | 'processing_manual';

export interface QueuedCourse {
  courseId: number;
  courseName: string;
  courseCode: string;
  semesterId: number;
  addedAt: Date;
}

interface RegistrationState {
  queue: QueuedCourse[];
  isRegistrationOpen: boolean;
  status: RegistrationStatus;
  currentSemesterId: number;
  timeUntilStart: number; // milliseconds
  
  // Actions
  addToQueue: (courses: Course[], semesterId: number) => void;
  removeFromQueue: (courseId: number) => void;
  clearQueue: () => void;
  startRegistrationProcess: (courses?: Course[], semesterId?: number) => Promise<void>;
  checkRegistrationTime: () => void;
  setSemester: (semesterId: number) => void;
  
  // Internal helper
  processRegistrationRequest: (courseId: number, courseName: string, courseCode: string, semesterId: number) => Promise<void>;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      queue: [],
      isRegistrationOpen: false,
      status: 'idle',
      currentSemesterId: 13, // Default semester, should be configurable
      timeUntilStart: 0,

      addToQueue: (courses, semesterId) => {
        const { queue } = get();
        const newQueuedCourses = courses
          .filter(course => !queue.some(q => q.courseId === course.id))
          .map(course => ({
            courseId: course.id,
            courseName: course.subjectName,
            courseCode: course.subjectCode,
            semesterId,
            addedAt: new Date(),
          }));

        set({ queue: [...queue, ...newQueuedCourses] });

        // Add log entries for queued courses
        const logStore = useLogStore.getState();
        newQueuedCourses.forEach(course => {
          logStore.addLogEntry({
            courseId: course.courseId,
            courseName: course.courseName,
            courseCode: course.courseCode,
            status: 'queued',
            message: `Added to registration queue. Will register automatically at ${REGISTRATION_START_TIME.toLocaleString()}`,
          });
        });
      },

      removeFromQueue: (courseId) => {
        set((state) => ({
          queue: state.queue.filter(course => course.courseId !== courseId)
        }));
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      startRegistrationProcess: async (courses, semesterId) => {
        const state = get();
        const coursesToProcess = courses || state.queue;
        const semester = semesterId || state.currentSemesterId;

        if (coursesToProcess.length === 0) return;

        set({ status: courses ? 'processing_manual' : 'processing_queue' });

        // Process courses sequentially to avoid overwhelming the server
        for (const course of coursesToProcess) {
          const courseId = 'courseId' in course ? course.courseId : course.id;
          const courseName = 'courseName' in course ? course.courseName : course.subjectName;
          const courseCode = 'courseCode' in course ? course.courseCode : course.subjectCode;

          await state.processRegistrationRequest(courseId, courseName, courseCode, semester);
          
          // Small delay between requests to be server-friendly
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Clear queue if we were processing queued items
        if (!courses) {
          set({ queue: [] });
        }

        set({ status: 'idle' });
      },

      checkRegistrationTime: () => {
        const now = new Date();
        const timeUntilStart = REGISTRATION_START_TIME.getTime() - now.getTime();
        const isOpen = now >= REGISTRATION_START_TIME && now <= REGISTRATION_END_TIME;
        
        set({ 
          isRegistrationOpen: isOpen,
          timeUntilStart: Math.max(0, timeUntilStart)
        });

        // Auto-start queue processing when registration opens
        const { queue, status } = get();
        const wasRegistrationClosed = !get().isRegistrationOpen;
        if (isOpen && queue.length > 0 && status === 'idle' && wasRegistrationClosed) {
          console.log('Registration time reached! Starting queue processing...');
          get().startRegistrationProcess();
        }
      },

      setSemester: (semesterId) => {
        set({ currentSemesterId: semesterId });
      },

      processRegistrationRequest: async (courseId, courseName, courseCode, semesterId) => {
        const logStore = useLogStore.getState();
        
        // Add pending log entry
        const logId = `${courseId}-${Date.now()}`;
        logStore.addLogEntry({
          courseId,
          courseName,
          courseCode,
          status: 'pending',
          message: 'Attempting to register...',
        });

        let lastLogId = logId;
        
        try {
          // The API service already handles retries, but we need to track them in the log
          const result = await new Promise<RegistrationResponse>((resolve, reject) => {
            let retryCount = 0;
            const maxRetries = 5;

            const attemptRequest = async (): Promise<void> => {
              try {
                const response = await apiService.registerForCourse(courseId, semesterId);
                resolve(response);
              } catch (error) {
                retryCount++;
                
                if (retryCount <= maxRetries) {
                  // Update log with retry status
                  const retryLogId = `${courseId}-retry-${retryCount}-${Date.now()}`;
                  logStore.addLogEntry({
                    courseId,
                    courseName,
                    courseCode,
                    status: 'retrying',
                    message: `Retrying registration... (Attempt ${retryCount}/${maxRetries})`,
                    retryAttempt: retryCount,
                    maxRetries,
                  });
                  lastLogId = retryLogId;
                  
                  // Wait before retry (exponential backoff)
                  const delay = 1000 * Math.pow(2, retryCount - 1);
                  setTimeout(attemptRequest, delay);
                } else {
                  reject(error);
                }
              }
            };

            attemptRequest();
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

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          logStore.updateLogEntry(lastLogId, {
            status: 'failed',
            message: `Registration permanently failed: ${errorMessage}`,
          });
        }
      },
    }),
    {
      name: 'registration-storage',
      partialize: (state) => ({ 
        queue: state.queue,
        currentSemesterId: state.currentSemesterId
      }),
    }
  )
);
