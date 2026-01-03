import { useState, useEffect } from 'react';
import { FinancialData } from '../types';

interface UseFinancialDataReturn {
  financialData: FinancialData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useFinancialData = (): UseFinancialDataReturn => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      const mockFinancialData: FinancialData = {
        payments: [],
        refunds: [],
        installments: [],
        expenses: [],
        incomes: [],
        budgets: [],
        pendingPayments: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        financialStats: {
          monthlyRevenue: Array(12).fill(0),
          monthlyExpenses: Array(12).fill(0),
          paymentMethods: {},
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      setFinancialData(mockFinancialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchFinancialData();
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  return {
    financialData,
    loading,
    error,
    refetch,
  };
};

export default useFinancialData; 
