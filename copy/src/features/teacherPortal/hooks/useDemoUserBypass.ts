import { useAuth } from '../../../contexts/AuthContext';

/**
 * Hook to check if the current user is the demo.teacher account
 * and should bypass backend requests
 */
export const useDemoUserBypass = () => {
  const { user } = useAuth();
  
  const isDemoUser = user?.username === 'demo.teacher';
  
  /**
   * Wraps an async API call to bypass it for demo.teacher users
   * @param apiCall - The async function to call
   * @param fallbackData - Data to return instead of making the API call
   * @returns Promise with either fallbackData (demo user) or actual API response
   */
  const withDemoBypass = async <T>(
    apiCall: () => Promise<T>,
    fallbackData: T
  ): Promise<T> => {
    if (isDemoUser) {
      console.log('🎭 Demo user detected - bypassing API call');
      return fallbackData;
    }
    return apiCall();
  };
  
  return {
    isDemoUser,
    withDemoBypass
  };
};
