import { useState, useCallback } from 'react';
import { customerCacheApi } from '../../../services/api/client';

const useCustomerCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<any | null>(null);
  const [cacheKeys, setCacheKeys] = useState<any[]>([]);

  const getCacheStats = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerCacheApi.getCacheStats();
      setCacheStats(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch cache stats'); throw err; }
    finally { setLoading(false); }
  }, []);

  const clearCache = useCallback(async () => {
    setLoading(true); setError(null);
    try { return (await customerCacheApi.clearCache()).data; }
    catch (err: any) { setError(err.message || 'Failed to clear cache'); throw err; }
    finally { setLoading(false); }
  }, []);

  const warmCache = useCallback(async (data: any) => {
    setLoading(true); setError(null);
    try { return (await customerCacheApi.warmCache(data)).data; }
    catch (err: any) { setError(err.message || 'Failed to warm cache'); throw err; }
    finally { setLoading(false); }
  }, []);

  const getCacheKeys = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await customerCacheApi.getCacheKeys();
      setCacheKeys(res.data || res);
      return res.data || res;
    } catch (err: any) { setError(err.message || 'Failed to fetch cache keys'); throw err; }
    finally { setLoading(false); }
  }, []);

  const deleteCacheKeys = useCallback(async (pattern: string) => {
    setLoading(true); setError(null);
    try { return (await customerCacheApi.deleteCacheKeys(pattern)).data; }
    catch (err: any) { setError(err.message || 'Failed to delete cache keys'); throw err; }
    finally { setLoading(false); }
  }, []);

  const optimizeCache = useCallback(async () => {
    setLoading(true); setError(null);
    try { return (await customerCacheApi.optimizeCache()).data; }
    catch (err: any) { setError(err.message || 'Failed to optimize cache'); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error, cacheStats, cacheKeys,
    getCacheStats, clearCache, warmCache, getCacheKeys, deleteCacheKeys, optimizeCache
  };
};

export default useCustomerCache; 
