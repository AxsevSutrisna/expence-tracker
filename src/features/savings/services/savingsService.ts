import { supabase } from '@shared/lib/supabase';
import { todayISO } from '@shared/utils/date';
import type { NewSavingsGoal, SavingsGoal } from '@shared/types';

export const getSavingsGoals = async (userId: string): Promise<SavingsGoal[]> => {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as SavingsGoal[]) ?? [];
};

export const createSavingsGoal = async (
  userId: string,
  goal: NewSavingsGoal
): Promise<SavingsGoal> => {
  const { data, error } = await supabase
    .from('savings_goals')
    .insert([
      {
        user_id: userId,
        name: goal.name,
        emoji: goal.emoji ?? null,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount ?? 0,
        target_date: goal.target_date ?? null,
        cadence: goal.cadence,
      },
    ])
    .select();
  if (error) throw error;
  return (data as SavingsGoal[])[0];
};

export const updateSavingsGoal = async (
  id: string,
  updates: Partial<SavingsGoal>
): Promise<void> => {
  const { error } = await supabase.from('savings_goals').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Catat setoran/penarikan: ubah `current_amount` (di-clamp ≥ 0). Setoran positif
 * juga memperbarui `last_contributed_at` = hari ini (untuk nudge & pengingat).
 */
export const contributeToGoal = async (goal: SavingsGoal, amount: number): Promise<void> => {
  const nextAmount = Math.max(0, goal.current_amount + amount);
  const updates: Partial<SavingsGoal> = { current_amount: nextAmount };
  if (amount > 0) updates.last_contributed_at = todayISO();
  const { error } = await supabase.from('savings_goals').update(updates).eq('id', goal.id);
  if (error) throw error;
};
