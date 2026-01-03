import { useState, useEffect } from 'react';
import { Transaction } from '../types/finance';

const useTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API call
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            description: 'Grocery Shopping',
            amount: 125.75,
            date: new Date(2023, 4, 15),
            category: 'Food',
            type: 'expense',
            accountId: '1',
          },
          {
            id: '2',
            description: 'Freelance Payment',
            amount: 850.00,
            date: new Date(2023, 4, 10),
            category: 'Work',
            type: 'income',
            accountId: '1',
          },
          // Add more mock transactions as needed
        ];

        setTransactions(mockTransactions);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters]);

  return { transactions, loading, error };
};

export default useTransactions;
