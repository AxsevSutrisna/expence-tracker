import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useTransactions(month, year) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (month && year) {
        // month is 1-12
        // Format dates as YYYY-MM-DD local time equivalent to ensure exact match with DB date strings
        // JS Date might be off by timezone, so construct string directly:
        const paddedMonth = String(month).padStart(2, '0');
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const paddedNextMonth = String(nextMonth).padStart(2, '0');
        
        const startStr = `${year}-${paddedMonth}-01`;
        const endStr = `${nextYear}-${paddedNextMonth}-01`;
        
        query = query.gte('date', startStr).lt('date', endStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, month, year]);

  const addTransaction = async (transactionData) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transactionData, user_id: user.id }])
        .select();
      
      if (error) throw error;
      
      const newTx = data[0];
      if (!month || !year) {
        setTransactions(prev => [newTx, ...prev]);
      } else {
        const txDateStr = newTx.date; // YYYY-MM-DD
        const [txYear, txMonth] = txDateStr.split('-');
        if (parseInt(txYear) === year && parseInt(txMonth) === month) {
          setTransactions(prev => [newTx, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return { success: false, error: error.message };
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();
      
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? data[0] : t));
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions
  };
}
