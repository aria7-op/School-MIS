import { useCallback } from 'react';

export const useToast = () => {
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    // Simple console log for now - can be enhanced with actual toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  return { showToast };
}; 