import { useState, useCallback } from 'react';
import { customerTasksApi } from '../../../services/api/client';

const useCustomerTasks = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any | null>(null);

  const getCustomerTasks = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) { setError('Customer ID is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await customerTasksApi.getCustomerTasks(targetId);
      setTasks(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch tasks'); throw err; }
    finally { setLoading(false); }
  }, [customerId]);

  const createTask = useCallback(async (id: string, data: any) => {
    setLoading(true); setError(null);
    try { return (await customerTasksApi.createTask(id, data)).data; }
    catch (err: any) { setError(err.message || 'Failed to create task'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getTaskDashboard = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerTasksApi.getTaskDashboard();
      setDashboard(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch task dashboard'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, tasks, dashboard,
    getCustomerTasks, createTask, getTaskDashboard
  };
};

export default useCustomerTasks; 
