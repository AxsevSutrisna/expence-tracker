import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button, Input, Select, Modal, ConfirmDeleteButton, ListRow } from '@shared/ui';
import { getBudgets, upsertBudget, deleteBudget } from '../services/budgetService';
import { formatIDR, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { getCategoryLabel, toCategoryOptions } from '@shared/utils/categories';
import { useResourceList } from '@shared/hooks/useResourceList';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { Budget, CategoryMap } from '@shared/types';

export interface BudgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  categories: CategoryMap;
}

export function BudgetManager({ isOpen, onClose, user, categories }: BudgetManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountLimit, setAmountLimit] = useState('');

  const expenseOptions = toCategoryOptions(categories, TRANSACTION_TYPES.EXPENSE);

  const fetcher = useCallback(() => getBudgets(user.id), [user.id]);
  const { items: budgets, loading, mutate } = useResourceList<Budget>(fetcher, isOpen);

  // Pilih kategori default saat modal dibuka.
  useEffect(() => {
    if (isOpen && !selectedCategory && expenseOptions.length > 0) {
      setSelectedCategory(String(expenseOptions[0].value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCategory || !amountLimit) return;
    mutate(async () => {
      await upsertBudget(user.id, selectedCategory, parseRupiah(amountLimit));
      setAmountLimit('');
    }, 'Gagal menyimpan budget');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Budget Bulanan">
      <div className="mb-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 border-4 border-border rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h4 className="font-bold">Setel Limit Budget Baru</h4>
          <div className="form-grid-2">
            <Select
              label="Kategori Pengeluaran"
              id="budget-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={expenseOptions}
              required
            />
            <Input
              label="Batas Maksimal (Rp)"
              type="text"
              placeholder="Misal: Rp. 500.000"
              value={amountLimit}
              onChange={(e) => setAmountLimit(formatRupiahInput(e.target.value))}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Simpan Budget'}
          </Button>
        </form>
      </div>

      <div>
        <h4 className="font-bold mb-4">Budget Anda Saat Ini</h4>
        {budgets.length === 0 ? (
          <p className="text-sm text-secondary">Belum ada budget yang diatur.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {budgets.map((b) => (
              <ListRow key={b.id}>
                <div>
                  <div className="font-bold">{getCategoryLabel(categories, TRANSACTION_TYPES.EXPENSE, b.category)}</div>
                  <div className="text-sm text-secondary">Limit: <span className="font-bold text-danger">{formatIDR(b.amount_limit)}</span> / bulan</div>
                </div>
                <ConfirmDeleteButton
                  className="text-xs px-3 py-1"
                  onConfirm={() => mutate(() => deleteBudget(b.id))}
                  title="Hapus Budget?"
                  description="Limit budget untuk kategori ini akan dihapus."
                />
              </ListRow>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
