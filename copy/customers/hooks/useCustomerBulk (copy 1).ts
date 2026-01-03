import { useState, useCallback } from 'react';
import { customerBulkApi } from  '../../../services/api/client';

const useCustomerBulk = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any | null>(null);

  const bulkCreateCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkCreateCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk create customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkUpdateCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkUpdateCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk update customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkDeleteCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkDeleteCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk delete customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkImportCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkImportCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk import customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkExportCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkExportCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk export customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkMergeCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkMergeCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk merge customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkDuplicateCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkDuplicateCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk duplicate customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkAssignCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkAssignCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk assign customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const bulkTagCustomers = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerBulkApi.bulkTagCustomers(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to bulk tag customers'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getBulkJobStatus = useCallback(async (jobId: string) => {
    setLoading(true); setError(null);
    try {
      const res = await customerBulkApi.getBulkJobStatus(jobId);
      setJobStatus(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to get bulk job status'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, jobStatus,
    bulkCreateCustomers, bulkUpdateCustomers, bulkDeleteCustomers, bulkImportCustomers, bulkExportCustomers,
    bulkMergeCustomers, bulkDuplicateCustomers, bulkAssignCustomers, bulkTagCustomers, getBulkJobStatus
  };
};

export default useCustomerBulk; 
