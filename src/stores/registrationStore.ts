import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseSubjectDto } from '../services/api';
import apiService from '../services/api';
import { useLogStore } from './logStore';

// Configuration - in a real app, this would come from the backend
export const REGISTRATION_START_TIME = new Date('2025-08-26T08:00:00');
export const REGISTRATION_END_TIME = new Date('2025-08-26T23:59:59');

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
  abortController: AbortController | null;
  
  // Actions
  addToQueue: (courses: CourseSubjectDto[], semesterId: number) => void;
  removeFromQueue: (courseId: number) => void;
  clearQueue: () => void;
  startRegistrationProcess: (courses?: CourseSubjectDto[], semesterId?: number) => Promise<void>;
  checkRegistrationTime: () => void;
  setSemester: (semesterId: number) => void;
  abortRegistration: () => void;
  
  // Internal helper
  processRegistrationRequest: (courseId: number, courseName: string, courseCode: string, semesterId: number, signal?: AbortSignal) => Promise<void>;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      queue: [],
      isRegistrationOpen: false,
      status: 'idle',
      currentSemesterId: 13, // Default semester, should be configurable
      timeUntilStart: 0,
      abortController: null,

      addToQueue: (courses, semesterId) => {
        const { queue } = get();
        // Filter out courses that are already registered (check = true)
        const newQueuedCourses = courses
          .filter(course => !course.check && !queue.some(q => q.courseId === course.id))
          .map(course => ({
            courseId: course.id,
            courseName: course.displayName || course.subjectName || 'Unknown Course',
            courseCode: course.code || course.subjectCode || 'Unknown Code',
            semesterId,
            addedAt: new Date(),
          }));

        if (newQueuedCourses.length === 0) {
          // If no courses to add (all already registered or queued), show a message
          const logStore = useLogStore.getState();
          logStore.addLogEntry({
            courseId: 0,
            courseName: 'Queue Update',
            courseCode: 'INFO',
            status: 'failed', // Using 'failed' status to indicate issue
            message: 'No new courses added to queue - all selected courses are already registered or queued.',
          });
          return;
        }

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

        // Abort any existing registration process
        if (state.abortController) {
          state.abortController.abort();
        }

        // Create new abort controller for this registration process
        const abortController = new AbortController();
        set({ status: courses ? 'processing_manual' : 'processing_queue', abortController });

        try {
          // Process courses sequentially to avoid overwhelming the server
          for (const course of coursesToProcess) {
            // Check if process was aborted
            if (abortController.signal.aborted) {
              console.log('Registration process was aborted');
              return;
            }

            const courseId = 'courseId' in course ? course.courseId : course.id;
            const courseName = 'courseName' in course ? course.courseName : (course.displayName || course.subjectName || 'Unknown Course');
            const courseCode = 'courseCode' in course ? course.courseCode : (course.code || course.subjectCode || 'Unknown Code');

            await state.processRegistrationRequest(courseId, courseName, courseCode, semester, abortController.signal);
            
            // Small delay between requests to be server-friendly
            if (!abortController.signal.aborted) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Clear queue if we were processing queued items and process wasn't aborted
          if (!courses && !abortController.signal.aborted) {
            set({ queue: [] });
          }
        } catch (error) {
          // Handle cancellation gracefully
          if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') {
            console.log('Registration process was cancelled');
            return;
          }
          throw error;
        } finally {
          // Only reset status if this abort controller is still the current one
          const currentState = get();
          if (currentState.abortController === abortController) {
            set({ status: 'idle', abortController: null });
          }
        }
      },

      abortRegistration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
          set({ 
            abortController: null,
            status: 'idle'
          });
        }
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

      processRegistrationRequest: async (courseId, courseName, courseCode, semesterId, signal) => {
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

        const lastLogId = logId;
        
        try {
          // Use the API service's built-in retry mechanism with abort signal
          const result = await apiService.registerForCourse(courseId, semesterId, signal);

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
          // Handle cancellation gracefully
          if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') {
            logStore.updateLogEntry(lastLogId, {
              status: 'failed',
              message: 'Registration was cancelled',
            });
            throw error; // Re-throw to stop the registration process
          }

          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          logStore.updateLogEntry(lastLogId, {
            status: 'failed',
            message: `Registration failed: ${errorMessage}`,
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
