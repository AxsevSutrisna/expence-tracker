import type { LucideIcon } from 'lucide-react';

/** Jenis transaksi: pemasukan atau pengeluaran. */
export type TransactionType = 'income' | 'expense';

/** Satu baris transaksi di tabel `transactions`. */
export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  /** Format YYYY-MM-DD */
  date: string;
  type: TransactionType;
  category?: string | null;
  receipt_url?: string | null;
  created_at?: string;
}

/** Payload untuk membuat/memperbarui transaksi (tanpa kolom turunan). */
export interface TransactionInput {
  title: string;
  amount: number;
  date: string;
  type: TransactionType;
  category?: string | null;
  receipt_url?: string | null;
}

/**
 * Kategori yang dipakai di seluruh UI. Dapat berupa kategori bawaan
 * (punya `icon`) atau kategori kustom dari DB (punya `emoji`, `isCustom`).
 */
export interface Category {
  id: string;
  label: string;
  color?: string;
  /** Hanya untuk kategori bawaan. */
  icon?: LucideIcon;
  /** Hanya untuk kategori kustom. */
  emoji?: string;
  isCustom?: boolean;
  type?: TransactionType;
  user_id?: string;
  created_at?: string;
}

/** Baris kategori kustom sebagaimana tersimpan di tabel `categories`. */
export interface CustomCategoryRow {
  id: string;
  user_id: string;
  type: TransactionType;
  label: string;
  emoji: string;
  color: string;
  created_at?: string;
}

/** Peta kategori per jenis transaksi (bentuk yang dipakai komponen). */
export interface CategoryMap {
  income: Category[];
  expense: Category[];
}

/** Data pembuatan kategori kustom. */
export interface NewCategoryData {
  type: TransactionType;
  label: string;
  emoji: string;
  color: string;
}

/** Satu baris budget di tabel `budgets`. */
export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount_limit: number;
  created_at?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Satu baris langganan di tabel `recurring_transactions`. */
export interface RecurringTransaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category?: string | null;
  type: TransactionType;
  frequency: RecurringFrequency;
  start_date: string;
  next_date: string;
  is_active: boolean;
  created_at?: string;
}

/** Data pembuatan langganan baru. */
export interface NewRecurringData {
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
  frequency?: RecurringFrequency;
  start_date: string;
  next_date: string;
}

/** Baris gamifikasi di tabel `user_gamification`. */
export interface UserGamification {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  badges: string[];
  updated_at?: string;
}

/** Irama/pengingat menabung. */
export type SavingsCadence = 'daily' | 'weekly' | 'monthly';

/** Satu target tabungan di tabel `savings_goals`. */
export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  emoji?: string | null;
  target_amount: number;
  current_amount: number;
  /** Tenggat (YYYY-MM-DD) untuk menghitung rencana per hari/minggu/bulan. */
  target_date?: string | null;
  cadence: SavingsCadence;
  last_contributed_at?: string | null;
  last_reminded_at?: string | null;
  is_active: boolean;
  created_at?: string;
}

/** Data pembuatan target tabungan baru. */
export interface NewSavingsGoal {
  name: string;
  emoji?: string | null;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  cadence: SavingsCadence;
}

/** Hasil terstruktur dari Edge Function pemindai struk. */
export interface ReceiptScanResult {
  title?: string;
  amount?: number;
  date?: string;
  category?: string;
  receiptUrl?: string | null;
}
