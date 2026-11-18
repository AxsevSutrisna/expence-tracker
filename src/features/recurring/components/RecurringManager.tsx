import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button, Input, Modal } from '@shared/ui';
import {
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
} from '../services/recurringService';
import { formatIDR, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { getCategoryLabel } from '@shared/utils/categories';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { CategoryMap, RecurringFrequency, RecurringTransaction, TransactionType } from '@shared/types';

export interface RecurringManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  categories: CategoryMap;
}

export function RecurringManager({ isOpen, onClose, user, categories }: RecurringManagerProps) {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const loadRecurring = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getRecurringTransactions(user.id);
      setRecurring(data);
    } catch (error) {
      console.error('Failed to load recurring trans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecurring();
      if (!category && categories?.expense?.length > 0) {
        setCategory(categories.expense[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, categories]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    try {
      setLoading(true);

      await addRecurringTransaction(user.id, {
        title,
        amount: parseRupiah(amount),
        type,
        category,
        frequency,
        start_date: startDate,
        next_date: startDate, // first trigger is the start date
      });

      setTitle('');
      setAmount('');
      await loadRecurring();
    } catch (error) {
      console.error('Failed to save recurring trans', error);
      alert('Gagal menyimpan langganan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteRecurringTransaction(id);
      await loadRecurring();
    } catch (error) {
      console.error('Failed to delete', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Langganan (Otomatis)">
      <div className="mb-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 border-4 border-border rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h4 className="font-bold">Tambah Langganan Baru</h4>

          <div className="input-group">
            <label className="input-label">Nama (Mis: Spotify, KPR)</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label className="input-label">Nominal (Rp)</label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Siklus</label>
              <select className="input-field cursor-pointer" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
                <option value="yearly">Tahunan</option>
                <option value="daily">Harian</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Tipe</label>
              <select className="input-field cursor-pointer" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value={TRANSACTION_TYPES.EXPENSE}>Pengeluaran</option>
                <option value={TRANSACTION_TYPES.INCOME}>Pemasukan</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Kategori</label>
              <select className="input-field cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)} required>
                {categories?.[type]?.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji ? `${c.emoji} ` : ''}{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group mt-2">
            <label className="input-label">Mulai Tanggal</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2">
            {loading ? 'Menyimpan...' : 'Simpan Langganan'}
          </Button>
        </form>
      </div>

      <div>
        <h4 className="font-bold mb-4">Daftar Langganan Aktif</h4>
        {recurring.length === 0 ? (
          <p className="text-sm text-secondary">Belum ada langganan otomatis.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2">
            {recurring.map((r) => (
              <div key={r.id} className="flex justify-between items-center p-3 border-2 border-border rounded-md" style={{ backgroundColor: '#fff' }}>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-sm text-secondary">
                    {getCategoryLabel(categories, r.type, r.category)} • <span className={r.type === 'income' ? 'text-success font-bold' : 'text-danger font-bold'}>{formatIDR(r.amount)}</span> / {r.frequency === 'monthly' ? 'Bulan' : r.frequency}
                  </div>
                  <div className="text-xs text-secondary mt-1">Jadwal berikut: {r.next_date}</div>
                </div>
                <Button variant="danger" className="text-xs px-3 py-1" onClick={() => handleDelete(r.id)}>
                  Setop
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
