import { useCallback } from 'react';
import { useResourceList } from '@shared/hooks/useResourceList';
import { getSavingsGoals } from '../services/savingsService';
import type { SavingsGoal } from '@shared/types';

/** Daftar target tabungan user, dengan reload & mutate (reuse useResourceList). */
export function useSavingsGoals(userId: string, enabled = true) {
  const fetcher = useCallback(() => getSavingsGoals(userId), [userId]);
  return useResourceList<SavingsGoal>(fetcher, enabled);
}
