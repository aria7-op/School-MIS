import { useState, useEffect } from 'react';
import { UserData } from '../types';

interface UseUserManagementReturn {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useUserManagement = (): UseUserManagementReturn => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockUserData: UserData = {
        users: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@school.edu',
            role: 'teacher',
            status: 'active',
            school: 'Main Campus',
            lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane.smith@school.edu',
            role: 'admin',
            status: 'active',
            school: 'Main Campus',
            lastLogin: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
          {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike.johnson@school.edu',
            role: 'staff',
            status: 'inactive',
            school: 'Branch Campus',
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ],
        pendingApprovals: 5,
        activeUsers: 245,
        inactiveUsers: 12,
        userStats: {
          byRole: {
            admin: 8,
            teacher: 45,
            staff: 32,
            student: 1200,
            parent: 800,
          },
          byStatus: {
            active: 245,
            inactive: 12,
            suspended: 3,
            pending: 5,
          },
          bySchool: {
            'Main Campus': 180,
            'Branch Campus': 65,
            'Online Campus': 15,
          },
        },
        recentActivity: [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            action: 'login',
            resource: 'system',
            resourceId: 'auth',
            details: 'User logged in successfully',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            status: 'success',
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Jane Smith',
            action: 'create',
            resource: 'user',
            resourceId: 'user123',
            details: 'Created new teacher account',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            status: 'success',
          },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setUserData(mockUserData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return {
    userData,
    loading,
    error,
    refetch,
  };
};

export default useUserManagement; 
