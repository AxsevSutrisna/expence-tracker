import { useMemo } from 'react';
import { TRANSACTION_TYPES } from '../utils/constants';

export function useTransactionSummary(transactions, filters = { keyword: '', minAmount: '', maxAmount: '' }) {
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Keyword filter
      if (filters.keyword && !t.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
        return false;
      }
      
      // 2. Min amount filter
      const minVal = filters.minAmount ? parseFloat(filters.minAmount.replace(/\D/g, '')) : null;
      if (minVal && t.amount < minVal) {
        return false;
      }
      
      // 3. Max amount filter
      const maxVal = filters.maxAmount ? parseFloat(filters.maxAmount.replace(/\D/g, '')) : null;
      if (maxVal && t.amount > maxVal) {
        return false;
      }
      
      return true;
    });
  }, [transactions, filters.keyword, filters.minAmount, filters.maxAmount]);

  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === TRANSACTION_TYPES.INCOME);
  }, [filteredTransactions]);

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
  }, [filteredTransactions]);

  const totalIncome = useMemo(() => {
    return incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [incomeTransactions]);

  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenseTransactions]);

  const balance = totalIncome - totalExpense;

  return {
    filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    balance
  };
}
