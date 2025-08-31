import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiService from '../services/api';

/**
 * Hook to handle session expiration events from the API service
 */
export const useSessionHandler = () => {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    // Set up session expiration callback
    const handleSessionExpired = () => {
      console.log('Session expired - logging out user');
      
      // Show a brief notification to the user (optional)
      // This could be replaced with a toast notification in the future
      setTimeout(() => {
        alert('Your session has expired. You will be redirected to the login page.');
      }, 100);
      
      logout();
    };

    apiService.setSessionExpiredCallback(handleSessionExpired);

    // Cleanup on unmount
    return () => {
      apiService.setSessionExpiredCallback(undefined);
    };
  }, [logout]);
};
