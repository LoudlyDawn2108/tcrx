import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import type { SemesterInfo } from '../services/api';

interface SemesterState {
  currentSemester: SemesterInfo | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCurrentSemester: () => Promise<void>;
  clearError: () => void;
}

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set) => ({
      currentSemester: null,
      loading: false,
      error: null,

      fetchCurrentSemester: async () => {
        try {
          set({ loading: true, error: null });
          const semesterInfo = await api.getCurrentSemesterInfo();
          set({ 
            currentSemester: semesterInfo, 
            loading: false 
          });
        } catch (error) {
          console.error('Failed to fetch semester info:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch semester info',
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
