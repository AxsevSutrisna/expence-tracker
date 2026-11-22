import { supabase } from '@shared/lib/supabase';
import { monthRange } from '@shared/utils/date';
import type { Transaction, TransactionInput } from '@shared/types';

/** Ambil transaksi milik user, opsional difilter per bulan/tahun (1-12). */
export async function fetchTransactions(
  userId: string,
  month?: number,
  year?: number
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (month && year) {
    // Rentang [start, end) bulan — string tanggal langsung agar bebas efek timezone JS Date.
    const { start, end } = monthRange(year, month);
    query = query.gte('date', start).lt('date', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Transaction[]) || [];
}

/** Sisipkan satu transaksi baru, kembalikan baris hasilnya. */
export async function insertTransaction(
  userId: string,
  transactionData: TransactionInput
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transactionData, user_id: userId }])
    .select();

  if (error) throw error;
  return (data as Transaction[])[0];
}

/** Hapus satu transaksi milik user. */
export async function removeTransaction(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

/** Perbarui satu transaksi milik user, kembalikan baris hasilnya. */
export async function updateTransactionById(
  id: string,
  userId: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return (data as Transaction[])[0];
}
