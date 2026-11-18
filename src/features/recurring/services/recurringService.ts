import { supabase } from '@shared/lib/supabase';
import type { NewRecurringData, RecurringTransaction, TransactionType } from '@shared/types';

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
    // Single query to insert all new transactions
    const { error: insertError } = await supabase.from('transactions').insert(newTransactions);
    if (insertError) console.error('Error bulk inserting transactions:', insertError);
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
