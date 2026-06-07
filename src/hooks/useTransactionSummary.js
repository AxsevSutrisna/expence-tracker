import { useMemo } from 'react';
import { TRANSACTION_TYPES } from '../utils/constants';

export function useTransactionSummary(transactions, searchQuery = '') {
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

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
