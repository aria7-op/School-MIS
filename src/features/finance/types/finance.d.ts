export type FinanceTab = 'transactions' | 'analytics' | 'budgets';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  type: 'income' | 'expense';
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent: number;
  startDate: Date;
  endDate: Date;
}

export interface Filters {
  transactionType: 'all' | 'income' | 'expense';
  categories: string[];
  amountRange: [number, number];
  dateRange: [Date, Date];
  accounts: string[];
}
