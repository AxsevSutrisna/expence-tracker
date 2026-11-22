import { supabase } from '@shared/lib/supabase';
import type { Budget } from '@shared/types';

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data as Budget[]) || [];
};

export const upsertBudget = async (
  userId: string,
  category: string,
  amountLimit: number
): Promise<Budget> => {
  // First, check if a budget for this category already exists
  const { data: existing, error: checkError } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('category', category)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 means zero rows returned (which is fine)
    throw checkError;
  }

  let result;
  if (existing) {
    // Update existing budget
    result = await supabase
      .from('budgets')
      .update({ amount_limit: amountLimit })
      .eq('id', existing.id)
      .select();
  } else {
    // Insert new budget
    result = await supabase
      .from('budgets')
      .insert([{ user_id: userId, category, amount_limit: amountLimit }])
      .select();
  }

  if (result.error) throw result.error;
  return (result.data as Budget[])[0];
};

/**
 * Terapkan banyak limit budget sekaligus tanpa N+1: SATU select untuk seluruh
 * budget user, lalu 1 bulk-insert (kategori baru) + update paralel (yang sudah ada).
 * Mengganti pola lama "upsert per kategori" (2 query × N). Mengembalikan jumlah
 * kategori yang disimpan.
 */
export const applyBudgets = async (
  userId: string,
  targets: Record<string, number>
): Promise<number> => {
  const entries = Object.entries(targets).filter(([, amount]) => amount > 0);
  if (entries.length === 0) return 0;

  const { data: existing, error: fetchError } = await supabase
    .from('budgets')
    .select('id, category')
    .eq('user_id', userId);
  if (fetchError) throw fetchError;

  const idByCategory = new Map<string, string>(
    ((existing as Array<{ id: string; category: string }>) ?? []).map((b) => [b.category, b.id])
  );

  const toInsert: Array<{ user_id: string; category: string; amount_limit: number }> = [];
  const toUpdate: Array<{ id: string; amount_limit: number }> = [];
  for (const [category, amount] of entries) {
    const id = idByCategory.get(category);
    if (id) toUpdate.push({ id, amount_limit: amount });
    else toInsert.push({ user_id: userId, category, amount_limit: amount });
  }

  const results = await Promise.all([
    ...(toInsert.length > 0 ? [supabase.from('budgets').insert(toInsert)] : []),
    ...toUpdate.map((u) =>
      supabase.from('budgets').update({ amount_limit: u.amount_limit }).eq('id', u.id)
    ),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;

  return entries.length;
};

export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
