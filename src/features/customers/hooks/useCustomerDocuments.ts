import { useState, useCallback } from 'react';
import { customerDocumentsApi } from '../../../services/api/client';

const useCustomerDocuments = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);

  const getCustomerDocuments = useCallback(async (id?: string) => {
    const targetId = id || customerId;
    if (!targetId) { setError('Customer ID is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await customerDocumentsApi.getCustomerDocuments(targetId);
      setDocuments(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch documents'); throw err; }
    finally { setLoading(false); }
  }, [customerId]);

  const uploadDocument = useCallback(async (id: string, data: any) => {
    setLoading(true); setError(null);
    try { return (await customerDocumentsApi.uploadDocument(id, data)).data; }
    catch (err: any) { setError(err.message || 'Failed to upload document'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getDocumentAnalytics = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerDocumentsApi.getDocumentAnalytics();
      setAnalytics(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch document analytics'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, documents, analytics,
    getCustomerDocuments, uploadDocument, getDocumentAnalytics
  };
};

export default useCustomerDocuments; 
