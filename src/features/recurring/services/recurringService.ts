import { supabase } from '@shared/lib/supabase';
import { dateInMonth, dayOfMonth, monthRange, pad2 } from '@shared/utils/date';
import type { NewRecurringData, RecurringTransaction, TransactionType } from '@shared/types';

/** Kunci unik sebuah transaksi untuk deteksi duplikat (judul+tipe+kategori+tanggal). */
const txKey = (t: { title: string; type: string; category?: string | null; date: string }) =>
  `${t.title}|${t.type}|${t.category ?? ''}|${t.date}`;

/**
 * Tanggal jatuh tempo berikutnya untuk item template bulanan pada "hari ke-`day`":
 * bulan ini bila harinya belum lewat, jika sudah lewat maka bulan depan.
 */
export const nextMonthlyDate = (day: number): string => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const thisMonth = dateInMonth(y, m, day);
  if (thisMonth >= todayStr) return thisMonth;
  const nm = m === 12 ? 1 : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return dateInMonth(ny, nm, day);
};

export const getRecurringTransactions = async (userId: string): Promise<RecurringTransaction[]> => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('next_date', { ascending: true });

  if (error) throw error;
  return (data as RecurringTransaction[]) || [];
};

export const addRecurringTransaction = async (
  userId: string,
  recurringData: NewRecurringData
): Promise<RecurringTransaction> => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert([{
      user_id: userId,
      title: recurringData.title,
      amount: recurringData.amount,
      category: recurringData.category,
      type: recurringData.type,
      frequency: recurringData.frequency || 'monthly',
      start_date: recurringData.start_date,
      next_date: recurringData.next_date,
      is_active: true,
    }])
    .select();

  if (error) throw error;
  return (data as RecurringTransaction[])[0];
};

/**
 * Terapkan beberapa pos template bulanan sekaligus tanpa N+1: SATU select untuk
 * seluruh pos bulanan user, lalu 1 bulk-insert (pos baru) + update paralel (pos
 * dengan judul+tipe sama → nominal/kategorinya diperbarui). Idempoten: aman
 * dipanggil berulang (mis. dari Perencana Gaji) tanpa menghasilkan duplikat.
 * Mengembalikan jumlah pos yang diproses.
 */
export const applyMonthlyTemplateItems = async (
  userId: string,
  items: Array<{ title: string; amount: number; category: string; type: TransactionType; day?: number }>
): Promise<number> => {
  if (items.length === 0) return 0;

  const { data: existing, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('id, title, type')
    .eq('user_id', userId)
    .eq('frequency', 'monthly');
  if (fetchError) throw fetchError;

  const idByKey = new Map<string, string>(
    ((existing as Array<{ id: string; title: string; type: string }>) ?? []).map((r) => [
      `${r.title}|${r.type}`,
      r.id,
    ])
  );

  const toInsert: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ id: string; amount: number; category: string }> = [];
  for (const item of items) {
    const id = idByKey.get(`${item.title}|${item.type}`);
    if (id) {
      toUpdate.push({ id, amount: item.amount, category: item.category });
    } else {
      const d = nextMonthlyDate(item.day ?? 1);
      toInsert.push({
        user_id: userId,
        title: item.title,
        amount: item.amount,
        category: item.category,
        type: item.type,
        frequency: 'monthly',
        start_date: d,
        next_date: d,
        is_active: true,
      });
    }
  }

  const results = await Promise.all([
    ...(toInsert.length > 0 ? [supabase.from('recurring_transactions').insert(toInsert)] : []),
    ...toUpdate.map((u) =>
      supabase
        .from('recurring_transactions')
        .update({ amount: u.amount, category: u.category, is_active: true })
        .eq('id', u.id)
    ),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  return items.length;
};

export const deleteRecurringTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

interface TransactionInsert {
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string | null;
  date: string;
}

// Evaluate and process pending recurring transactions
export const processPendingRecurring = async (userId: string): Promise<number> => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const { data: pending, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_date', today);

  if (error) throw error;
  if (!pending || pending.length === 0) return 0; // nothing to process

  let processedCount = 0;
  const newTransactions: TransactionInsert[] = [];
  const recurringUpdates: Array<{ id: string; next_date: string }> = [];

  for (const recurring of pending as RecurringTransaction[]) {
    const currentNextDate = new Date(recurring.next_date);
    const currentDateObj = new Date(today);

    // Process multiple times if it's way overdue
    while (currentNextDate <= currentDateObj) {
      // 1. Queue insert into transactions
      newTransactions.push({
        user_id: userId,
        title: `${recurring.title} (Auto)`,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category ?? null,
        date: currentNextDate.toISOString().split('T')[0],
      });

      // 2. Calculate next date
      if (recurring.frequency === 'monthly') {
        currentNextDate.setMonth(currentNextDate.getMonth() + 1);
      } else if (recurring.frequency === 'weekly') {
        currentNextDate.setDate(currentNextDate.getDate() + 7);
      } else if (recurring.frequency === 'daily') {
        currentNextDate.setDate(currentNextDate.getDate() + 1);
      } else if (recurring.frequency === 'yearly') {
        currentNextDate.setFullYear(currentNextDate.getFullYear() + 1);
      } else {
        // Fallback
        currentNextDate.setMonth(currentNextDate.getMonth() + 1);
      }
      processedCount++;
    }

    // 3. Queue the recurring transaction's next_date update
    recurringUpdates.push({
      id: recurring.id,
      next_date: currentNextDate.toISOString().split('T')[0],
    });
  }

  // Batch Database Operations
  if (newTransactions.length > 0) {
    // Dedup terhadap transaksi yang sudah ada (mis. hasil "Terapkan template" manual)
    // agar auto-generate tidak menghasilkan duplikat. Prosesnya jadi idempoten.
    const sortedDates = newTransactions.map((t) => t.date).sort();
    const { data: existing } = await supabase
      .from('transactions')
      .select('title,type,category,date')
      .eq('user_id', userId)
      .gte('date', sortedDates[0])
      .lte('date', sortedDates[sortedDates.length - 1]);

    const existingKeys = new Set((existing ?? []).map(txKey));
    const toInsert = newTransactions.filter((t) => !existingKeys.has(txKey(t)));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('transactions').insert(toInsert);
      if (insertError) console.error('Error bulk inserting transactions:', insertError);
    }
  }

  if (recurringUpdates.length > 0) {
    // Update next_dates in parallel (one update per recurring item, not per overdue instance).
    await Promise.all(
      recurringUpdates.map((update) =>
        supabase
          .from('recurring_transactions')
          .update({ next_date: update.next_date })
          .eq('id', update.id)
      )
    );
  }

  return processedCount;
};

/**
 * Terapkan "Template Bulanan" (item langganan bulanan aktif) ke sebuah bulan tertentu,
 * membuat transaksinya sekaligus. Idempoten: item yang sudah ada di bulan itu dilewati,
 * jadi aman dipanggil berulang dan tidak bentrok dengan auto-generate.
 *
 * @returns jumlah transaksi baru yang dibuat.
 */
export const applyTemplateToMonth = async (
  userId: string,
  year: number,
  month: number // 1-12
): Promise<number> => {
  const { start, end } = monthRange(year, month);

  const [templates, existingRes] = await Promise.all([
    getRecurringTransactions(userId),
    supabase
      .from('transactions')
      .select('title,type,category,date')
      .eq('user_id', userId)
      .gte('date', start)
      .lt('date', end),
  ]);

  const monthly = templates.filter((t) => t.frequency === 'monthly' && t.is_active);
  if (monthly.length === 0) return 0;

  const existingKeys = new Set((existingRes.data ?? []).map(txKey));

  const toInsert: TransactionInsert[] = [];
  for (const item of monthly) {
    const date = dateInMonth(year, month, dayOfMonth(item.start_date));
    const candidate: TransactionInsert = {
      user_id: userId,
      title: `${item.title} (Auto)`,
      amount: item.amount,
      type: item.type,
      category: item.category ?? null,
      date,
    };
    if (existingKeys.has(txKey(candidate))) continue; // sudah ada → lewati
    toInsert.push(candidate);
  }

  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from('transactions').insert(toInsert);
  if (error) throw error;
  return toInsert.length;
};
