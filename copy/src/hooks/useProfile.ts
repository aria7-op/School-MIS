import { useQuery } from '@tanstack/react-query';
import secureApiService from '../services/secureApiService';

export interface UserProfile {
  id: string;
  uuid: string;
  username: string;
  phone?: string;
  phoneVerified?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  dariName?: string;
  gender?: string;
  birthDate?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  role: string;
  status: string;
  lastLogin: string;
  lastIp: string;
  timezone: string;
  locale: string;
  metadata?: any;
  schoolId: string;
  createdByOwnerId: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  school: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    logo: string;
    themeColor: string;
    timezone: string;
    locale: string;
    currency: string;
    status: string;
  };
  teacher?: any;
  parent?: any;
  student?: any;
  totalSessions?: number;
}

export const useProfile = () => {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async (): Promise<UserProfile> => {
      // console.log('🔍 useProfile: Fetching user profile from /auth/me endpoint...');
      try {
        const response = await secureApiService.get<UserProfile>('/auth/me');
        // console.log('🔍 useProfile: API response:', response);
        return response.data;
      } catch (error) {
        console.error('🔍 useProfile: API error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    retry: 1,
  });

  return {
    profile,
    isLoading,
    error,
    refetch,
    isError
  };
};
