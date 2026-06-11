import { supabase } from './supabase';

export const getRecurringTransactions = async (userId) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('next_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const addRecurringTransaction = async (userId, recurringData) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert([
      {
        user_id: userId,
        title: recurringData.title,
        amount: recurringData.amount,
        category: recurringData.category,
        type: recurringData.type,
        frequency: recurringData.frequency || 'monthly',
        start_date: recurringData.start_date,
        next_date: recurringData.next_date,
        is_active: true
      }
    ])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateRecurringTransaction = async (id, updates) => {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteRecurringTransaction = async (id) => {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Evaluate and process pending recurring transactions
export const processPendingRecurring = async (userId) => {
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
  const newTransactions = [];
  const recurringUpdates = [];

  for (const recurring of pending) {
    let currentNextDate = new Date(recurring.next_date);
    const currentDateObj = new Date(today);
    
    // Process multiple times if it's way overdue
    while (currentNextDate <= currentDateObj) {
      // 1. Queue insert into transactions
      newTransactions.push({
        user_id: userId,
        title: `${recurring.title} (Auto)`,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: currentNextDate.toISOString().split('T')[0]
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
      next_date: currentNextDate.toISOString().split('T')[0]
    });
  }

  // Batch Database Operations
  if (newTransactions.length > 0) {
    // Single query to insert all new transactions
    const { error: insertError } = await supabase.from('transactions').insert(newTransactions);
    if (insertError) console.error("Error bulk inserting transactions:", insertError);
  }

  if (recurringUpdates.length > 0) {
    // Update next_dates. Since standard REST doesn't easily support batch updates without a unique constraint match,
    // we iterate promises here, but it's parallelized and only happens once per recurring item, not per overdue instance.
    // This reduces an N*M query problem down to 1 insert query + N update queries (parallel).
    await Promise.all(
      recurringUpdates.map(update => 
        supabase
          .from('recurring_transactions')
          .update({ next_date: update.next_date })
          .eq('id', update.id)
      )
    );
  }

  return processedCount;
};
