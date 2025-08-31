import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import type { SemesterInfo } from '../services/api';

interface SemesterState {
  currentSemester: SemesterInfo | null;
  loading: boolean;
  error: string | null;
  abortController: AbortController | null;
  
  // Actions
  fetchCurrentSemester: () => Promise<void>;
  clearError: () => void;
  abortRequests: () => void;
}

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set, get) => ({
      currentSemester: null,
      loading: false,
      error: null,
      abortController: null,

      fetchCurrentSemester: async () => {
        // Abort any existing request
        const { abortController: existingController } = get();
        if (existingController) {
          existingController.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        
        try {
          set({ loading: true, error: null, abortController });
          const semesterInfo = await api.getCurrentSemesterInfo(abortController.signal);
          
          // Only update state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            set({ 
              currentSemester: semesterInfo, 
              loading: false,
              abortController: null
            });
          }
        } catch (error) {
          console.error('Failed to fetch semester info:', error);
          
          // Don't set error if request was cancelled
          if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') {
            console.log('Semester request was cancelled');
            return;
          }
          
          // Only update state if this request wasn't aborted
          if (!abortController.signal.aborted) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch semester info',
              loading: false,
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
            loading: false
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'semester-store',
      partialize: (state) => ({
        currentSemester: state.currentSemester,
      }),
    }
  )
);
