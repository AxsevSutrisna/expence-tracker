import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@features/auth';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import { getPreviousMonth } from '@shared/utils/date';
import { fetchTransactions } from '../services/transactionService';
import type { Transaction } from '@shared/types';

export interface MonthTotals {
  income: number;
  expense: number;
}

export interface MonthComparisonResult {
  current: MonthTotals;
  previous: MonthTotals;
  /** Persentase perubahan vs bulan lalu; null bila bulan lalu = 0 (tak terdefinisi). */
  incomeChange: number | null;
  expenseChange: number | null;
  loading: boolean;
}

const sumByType = (txs: Transaction[]): MonthTotals => {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === TRANSACTION_TYPES.INCOME) income += t.amount;
    else if (t.type === TRANSACTION_TYPES.EXPENSE) expense += t.amount;
  }
  return { income, expense };
};

const pctChange = (current: number, previous: number): number | null => {
  if (previous === 0) return null; // tak terdefinisi: tidak ada basis bulan lalu
  return ((current - previous) / previous) * 100;
};

/**
 * Bandingkan total pemasukan/pengeluaran bulan terpilih dengan bulan sebelumnya.
 * Bulan berjalan dihitung dari `currentTransactions` (sudah dimuat), bulan lalu
 * diambil sekali lewat satu query.
 */
export function useMonthComparison(
  currentTransactions: Transaction[],
  month: number, // 1-12
  year: number
): MonthComparisonResult {
  const { user } = useAuth();
  const [previous, setPrevious] = useState<MonthTotals>({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    fetchTransactions(user.id, prevMonth, prevYear)
      .then((txs) => {
        if (active) setPrevious(sumByType(txs));
      })
      .catch((error) => console.error('Gagal memuat transaksi bulan sebelumnya', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, prevMonth, prevYear]);

  const current = useMemo(() => sumByType(currentTransactions), [currentTransactions]);

  return {
    current,
    previous,
    incomeChange: pctChange(current.income, previous.income),
    expenseChange: pctChange(current.expense, previous.expense),
    loading,
  };
}
