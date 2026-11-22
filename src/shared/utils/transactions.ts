import type { Transaction } from '@shared/types';

/**
 * Jumlahkan pengeluaran per id kategori dari daftar transaksi.
 * Sumber tunggal untuk perhitungan "terpakai per kategori" (dipakai BudgetProgress,
 * evaluasi streak budget di Dashboard, dan realisasi Perencana Gaji) — jangan duplikasi.
 */
export const sumExpensesByCategory = (transactions: Transaction[]): Record<string, number> => {
  const byCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category) continue;
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }
  return byCategory;
};
