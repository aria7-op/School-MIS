export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
  return `${type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(amount))}`;
};
