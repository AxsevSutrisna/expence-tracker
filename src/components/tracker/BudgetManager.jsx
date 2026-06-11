import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '../ui';
import { getBudgets, upsertBudget, deleteBudget } from '../../lib/budgetService';

export function BudgetManager({ isOpen, onClose, user, categories }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountLimit, setAmountLimit] = useState('');

  // Combine default and custom expense categories
  const expenseCategories = categories?.expense || [];

  const loadBudgets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getBudgets(user.id);
      setBudgets(data);
    } catch (error) {
      console.error('Failed to load budgets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBudgets();
      if (expenseCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(expenseCategories[0].id);
      }
    }
  }, [isOpen, user, expenseCategories]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !amountLimit) return;

    try {
      setLoading(true);
      const cleanAmount = amountLimit.replace(/\D/g, '');
      await upsertBudget(user.id, selectedCategory, parseInt(cleanAmount, 10));
      setAmountLimit('');
      await loadBudgets();
    } catch (error) {
      console.error('Failed to save budget', error);
      alert('Gagal menyimpan budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteBudget(id);
      await loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryLabel = (catId) => {
    const cat = expenseCategories.find(c => c.id === catId);
    if (!cat) return catId;
    return cat.emoji ? `${cat.emoji} ${cat.label}` : cat.label;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Budget Bulanan">
      <div className="mb-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 border-4 border-border rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h4 className="font-bold">Setel Limit Budget Baru</h4>
          <div className="form-grid-2">
            <div className="input-group">
              <label className="input-label">Kategori Pengeluaran</label>
              <select 
                className="input-field cursor-pointer" 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                required
              >
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Batas Maksimal (Rp)</label>
              <Input
                type="text"
                placeholder="Misal: Rp. 500.000"
                value={amountLimit}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmountLimit(val ? `Rp. ${parseInt(val, 10).toLocaleString('id-ID')}` : '');
                }}
                required
              />
            </div>
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
            {budgets.map(b => (
              <div key={b.id} className="flex justify-between items-center p-3 border-2 border-border rounded-md" style={{ backgroundColor: '#fff' }}>
                <div>
                  <div className="font-bold">{getCategoryLabel(b.category)}</div>
                  <div className="text-sm text-secondary">Limit: <span className="font-bold text-danger">{formatCurrency(b.amount_limit)}</span> / bulan</div>
                </div>
                <Button variant="danger" className="text-xs px-3 py-1" onClick={() => handleDelete(b.id)}>
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
