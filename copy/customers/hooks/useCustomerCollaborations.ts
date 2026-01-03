import { useState, useCallback } from 'react';
import { customerCollaborationsApi } from '../../../services/api/client';

const useCustomerCollaborations = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);

  const getCustomerCollaborations = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) { setError('Customer ID is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await customerCollaborationsApi.getCustomerCollaborations(targetId);
      setCollaborations(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch collaborations'); throw err; }
    finally { setLoading(false); }
  }, [customerId]);

  const createCollaboration = useCallback(async (id: string, data: any) => {
    setLoading(true); setError(null);
    try { return (await customerCollaborationsApi.createCollaboration(id, data)).data; }
    catch (err: any) { setError(err.message || 'Failed to create collaboration'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getCollaborationFeed = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerCollaborationsApi.getCollaborationFeed();
      setFeed(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch collaboration feed'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, collaborations, feed,
    getCustomerCollaborations, createCollaboration, getCollaborationFeed
  };
};

export default useCustomerCollaborations; 
