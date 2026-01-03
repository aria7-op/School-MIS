import { useState, useEffect } from 'react';
import { SystemAlert } from '../types';

interface UseAdminAlertsReturn {
  alerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useAdminAlerts = (): UseAdminAlertsReturn => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High CPU Usage',
          message: 'CPU usage has exceeded 80% for the last 10 minutes. Consider investigating background processes.',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
          priority: 'medium',
          category: 'system',
          isRead: false,
          actionRequired: true,
        },
        {
          id: '2',
          type: 'error',
          title: 'Database Connection Failed',
          message: 'Failed to connect to the primary database. Backup connection is being used.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          priority: 'high',
          category: 'database',
          isRead: false,
          actionRequired: true,
        },
        {
          id: '3',
          type: 'info',
          title: 'System Backup Completed',
          message: 'Daily system backup completed successfully. Backup size: 2.5GB',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          priority: 'low',
          category: 'backup',
          isRead: true,
          actionRequired: false,
        },
        {
          id: '4',
          type: 'success',
          title: 'New User Registration',
          message: 'New teacher account created: Sarah Johnson (sarah.johnson@school.edu)',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          priority: 'low',
          category: 'user',
          isRead: true,
          actionRequired: false,
        },
        {
          id: '5',
          type: 'warning',
          title: 'Low Disk Space',
          message: 'Available disk space is below 10%. Consider cleaning up temporary files.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          priority: 'medium',
          category: 'storage',
          isRead: false,
          actionRequired: true,
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setAlerts(mockAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchAlerts();
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    alerts,
    loading,
    error,
    refetch,
  };
};

export default useAdminAlerts; 
