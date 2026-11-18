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

export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
