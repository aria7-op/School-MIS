import { useState, useCallback } from 'react';
import { customerAutomationsApi } from '../../../services/api/client';

const useCustomerAutomations = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [automations, setAutomations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const getCustomerAutomations = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) { setError('Customer ID is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await customerAutomationsApi.getCustomerAutomations(targetId);
      setAutomations(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch automations'); throw err; }
    finally { setLoading(false); }
  }, [customerId]);

  const createAutomation = useCallback(async (id: string, data: any) => {
    setLoading(true); setError(null);
    try { return (await customerAutomationsApi.createAutomation(id, data)).data; }
    catch (err: any) { setError(err.message || 'Failed to create automation'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getAutomationTemplates = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerAutomationsApi.getAutomationTemplates();
      setTemplates(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch automation templates'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, automations, templates,
    getCustomerAutomations, createAutomation, getAutomationTemplates
  };
};

export default useCustomerAutomations; 
