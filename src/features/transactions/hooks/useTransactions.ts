import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@features/auth';
import type { Transaction, TransactionInput } from '@shared/types';
import {
  fetchTransactions,
  insertTransaction,
  removeTransaction,
  updateTransactionById,
} from '../services/transactionService';

export interface MutationResult {
  success: boolean;
  error?: string;
}

export function useTransactions(month?: number, year?: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchTransactions(user.id, month, year);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, month, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = async (transactionData: TransactionInput): Promise<MutationResult> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const newTx = await insertTransaction(user.id, transactionData);

      if (!month || !year) {
        setTransactions((prev) => [newTx, ...prev]);
      } else {
        const [txYear, txMonth] = newTx.date.split('-');
        if (parseInt(txYear, 10) === year && parseInt(txMonth, 10) === month) {
          setTransactions((prev) =>
            [newTx, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        }
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error adding transaction:', error);
      return { success: false, error: message };
    }
  };

  const deleteTransaction = async (id: string): Promise<MutationResult> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      await removeTransaction(id, user.id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error deleting transaction:', error);
      return { success: false, error: message };
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<MutationResult> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const updated = await updateTransactionById(id, user.id, updates);
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error updating transaction:', error);
      return { success: false, error: message };
    }
  };

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh,
  };
}
