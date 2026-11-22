import { useState, useEffect, useCallback } from 'react';
import { fetchCustomCategories } from '@features/categories/services/categoryService';
import { fetchTransactions } from '@features/transactions/services/transactionService';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import { monthName } from '@shared/utils/date';
import type { CustomCategoryRow, Transaction } from '@shared/types';

export interface PlannerData {
  /** Kategori kustom bertipe pengeluaran milik user. */
  customExpenseCats: CustomCategoryRow[];
  /** Transaksi pengeluaran bulan berjalan (untuk perbandingan realisasi). */
  monthExpenses: Transaction[];
  /** Label bulan berjalan, mis. "November 2026". */
  monthLabel: string;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Memuat data pendukung Perencana Gaji: kategori kustom (pengeluaran) + realisasi
 * pengeluaran bulan ini. Dipakai untuk pemetaan budget kustom & perbandingan alokasi.
 */
export function usePlannerData(userId: string): PlannerData {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthLabel = `${monthName(month)} ${year}`;

  const [customExpenseCats, setCustomExpenseCats] = useState<CustomCategoryRow[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, txs] = await Promise.all([
        fetchCustomCategories(userId),
        fetchTransactions(userId, month, year),
      ]);
      setCustomExpenseCats(cats.filter((c) => c.type === TRANSACTION_TYPES.EXPENSE));
      setMonthExpenses(txs.filter((t) => t.type === TRANSACTION_TYPES.EXPENSE));
    } catch (e) {
      console.error('Gagal memuat data planner:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { customExpenseCats, monthExpenses, monthLabel, loading, reload };
}
