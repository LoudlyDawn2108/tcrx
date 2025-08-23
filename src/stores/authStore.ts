import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../services/api';
import apiService from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          await apiService.login(username, password);
          const user = await apiService.getCurrentUser();
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: errorMessage 
          });
          return false;
        }
      },

      logout: () => {
        apiService.logout();
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      fetchUser: async () => {
        if (!apiService.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        
        try {
          const user = await apiService.getCurrentUser();
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
        } catch {
          // Token might be expired
          apiService.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Session expired. Please login again.' 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user 
      }),
    }
  )
);
