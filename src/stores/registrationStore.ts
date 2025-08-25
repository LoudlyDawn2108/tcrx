import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CourseSubjectDto, RegistrationResponse } from '../services/api';
import apiService from '../services/api';
import { useCourseStore } from './courseStore';
import { useLogStore } from './logStore';
import { useAuthStore } from './authStore';

// Configuration - in a real app, this would come from the backend
export const REGISTRATION_START_TIME = new Date(Date.now() + 1 * 60 * 1000); // 3 phút từ hiện tại
export const REGISTRATION_END_TIME = new Date('2025-08-26T23:59:59');

export type RegistrationStatus = 'idle' | 'processing_queue' | 'processing_manual';


export interface QueuedCourse {
  subjectId: number;
  courseId: number; // Lớp lý thuyết
  subCourseId?: number; // Lớp thực hành (nếu có)
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
  addToQueue: (courses: CourseSubjectDto[], semesterId: number) => void;
  removeFromQueue: (courseId: number) => void;
  clearQueue: () => void;
  startRegistrationProcess: (courses?: CourseSubjectDto[], semesterId?: number, personId?: number, registrationPeriodId?: number) => Promise<void>;
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
        // Gom theo subjectId, mỗi subject chỉ có 1 entry (lý thuyết + thực hành nếu có)
        const subjectMap = new Map<number, QueuedCourse>();

        courses.forEach(course => {
          const subjectId = course.subjectId;
          if (!subjectId) return;
          if (course.parent) {
            // Lớp thực hành (subCourse)
            const prev = subjectMap.get(subjectId);
            if (prev) {
              prev.subCourseId = course.id;
            } else {
              subjectMap.set(subjectId, {
                subjectId,
                courseId: course.parent.id,
                subCourseId: course.id,
                courseName: course.displayName || course.subjectName || 'Unknown Course',
                courseCode: course.code || course.subjectCode || 'Unknown Code',
                semesterId,
                addedAt: new Date(),
              });
            }
          } else {
            // Lớp lý thuyết
            subjectMap.set(subjectId, {
              subjectId,
              courseId: course.id,
              courseName: course.displayName || course.subjectName || 'Unknown Course',
              courseCode: course.code || course.subjectCode || 'Unknown Code',
              semesterId,
              addedAt: new Date(),
            });
          }
        });

        // Lọc queue cũ, bỏ các subjectId đã có trong subjectMap
        const filteredQueue = queue.filter(q => !subjectMap.has(q.subjectId));
        const newQueuedCourses = Array.from(subjectMap.values());

        if (newQueuedCourses.length === 0) {
          // Nếu không có gì để thêm
          const logStore = useLogStore.getState();
          logStore.addLogEntry({
            courseId: 0,
            courseName: 'Queue Update',
            courseCode: 'INFO',
            status: 'failed',
            message: 'No new courses added to queue - all selected courses are already registered or queued.',
          });
          return;
        }

        set({ queue: [...filteredQueue, ...newQueuedCourses] });

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

      startRegistrationProcess: async (courses, _unused, personId, registrationPeriodId) => {
        console.log('[REG-PROCESS] Called startRegistrationProcess', { courses, personId, registrationPeriodId });
        const state = get();
        const logStore = useLogStore.getState();
        const getCourseObjectById = useCourseStore.getState().getCourseObjectById;
        if (!personId || !registrationPeriodId) {
          throw new Error('personId và registrationPeriodId là bắt buộc khi đăng ký!');
        }
        // Nếu truyền vào courses (manual), vẫn xử lý như cũ (dạng CourseSubjectDto[])
        if (courses && courses.length > 0) {
          set({ status: 'processing_manual' });
          for (const course of courses) {
            const courseId = 'id' in course ? course.id : undefined;
            if (!courseId) continue;
            const courseObj = getCourseObjectById(courseId);
            if (!courseObj) continue;
            await apiService.registerForCourseFullObject(courseObj, personId, registrationPeriodId);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          // Queue mode: luôn là QueuedCourse
          const queue = state.queue;
          if (queue.length === 0) return;
          set({ status: 'processing_queue' });
          for (const item of queue) {
            // Đăng ký lớp lý thuyết
            const mainObj = getCourseObjectById(item.courseId);
            if (mainObj) {
              await apiService.registerForCourseFullObject(mainObj, personId, registrationPeriodId);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            // Nếu có lớp thực hành, đăng ký tiếp
            if (item.subCourseId) {
              const subObj = getCourseObjectById(item.subCourseId);
              if (subObj) {
                logStore.addLogEntry({
                  courseId: item.subCourseId,
                  courseName: (subObj.displayName || subObj.subjectName || 'Thực hành'),
                  courseCode: subObj.code || subObj.subjectCode || '',
                  status: 'pending',
                  message: 'Attempting to register (practical class)...',
                });
                await apiService.registerForCourseFullObject(subObj, personId, registrationPeriodId);
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          // Clear queue nếu là auto
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
          console.log('[AUTO-REG] Registration time reached! Starting queue processing...');
          // Lấy personId từ authStore, registrationPeriodId từ queue (giả định tất cả cùng 1 period)
          const auth = useAuthStore.getState();
          const user = auth.user;
          const personId = user?.person?.id;
          const registrationPeriodId = queue[0]?.semesterId;
          if (personId && registrationPeriodId) {
            console.log('[AUTO-REG] Gọi startRegistrationProcess với', { personId, registrationPeriodId, queue });
            get().startRegistrationProcess(undefined, undefined, personId, registrationPeriodId);
          } else {
            console.warn('[AUTO-REG] Không thể tự động đăng ký: thiếu personId hoặc registrationPeriodId', { personId, registrationPeriodId, user });
          }
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
