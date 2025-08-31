import { useEffect } from 'react';
import { useCourseStore } from '../stores/courseStore';
import { useSemesterStore } from '../stores/semesterStore';
// import { useRegistrationStore } from '../stores/registrationStore';

/**
 * Hook to handle cleanup of ongoing requests when components unmount
 * This is particularly useful when users logout or navigate away during API calls
 */
export const useRequestCleanup = () => {
  const abortCourseRequests = useCourseStore(state => state.abortRequests);
  const abortSemesterRequests = useSemesterStore(state => state.abortRequests);
  // const abortRegistration = useRegistrationStore(state => state.abortRegistration);

  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      abortCourseRequests();
      abortSemesterRequests();
      // abortRegistration();
    };
  }, [abortCourseRequests, abortSemesterRequests]);
};
