import { useMemo } from 'react';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { Transaction } from '@shared/types';

export interface TransactionFilters {
  keyword: string;
  minAmount: string;
  maxAmount: string;
}

const EMPTY_FILTERS: TransactionFilters = { keyword: '', minAmount: '', maxAmount: '' };

export function useTransactionSummary(
  transactions: Transaction[],
  filters: TransactionFilters = EMPTY_FILTERS
) {
  const filteredTransactions = useMemo(() => {
    // Parse filter bounds ONCE outside the loop
    const minVal = filters.minAmount ? parseFloat(filters.minAmount.replace(/\D/g, '')) : null;
    const maxVal = filters.maxAmount ? parseFloat(filters.maxAmount.replace(/\D/g, '')) : null;
    const keywordLower = filters.keyword ? filters.keyword.toLowerCase() : '';

    return transactions.filter((t) => {
      // 1. Keyword filter
      if (keywordLower && !t.title.toLowerCase().includes(keywordLower)) {
        return false;
      }
      // 2. Min amount filter
      if (minVal !== null && t.amount < minVal) {
        return false;
      }
      // 3. Max amount filter
      if (maxVal !== null && t.amount > maxVal) {
        return false;
      }
      return true;
    });
  }, [transactions, filters.keyword, filters.minAmount, filters.maxAmount]);

  const incomeTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === TRANSACTION_TYPES.INCOME),
    [filteredTransactions]
  );

  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === TRANSACTION_TYPES.EXPENSE),
    [filteredTransactions]
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0),
    [incomeTransactions]
  );

  const totalExpense = useMemo(
    () => expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0),
    [expenseTransactions]
  );

  const balance = totalIncome - totalExpense;

  return {
    filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    balance,
  };
}
