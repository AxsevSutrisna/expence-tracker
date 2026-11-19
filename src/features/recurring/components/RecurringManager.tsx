import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button, Input, Select, Modal, ConfirmDeleteButton, ListRow } from '@shared/ui';
import {
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
} from '../services/recurringService';
import { formatIDR, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { getCategoryLabel, toCategoryOptions } from '@shared/utils/categories';
import { useResourceList } from '@shared/hooks/useResourceList';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { CategoryMap, RecurringFrequency, RecurringTransaction, TransactionType } from '@shared/types';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Bulanan' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'yearly', label: 'Tahunan' },
  { value: 'daily', label: 'Harian' },
];

const TYPE_OPTIONS = [
  { value: TRANSACTION_TYPES.EXPENSE, label: 'Pengeluaran' },
  { value: TRANSACTION_TYPES.INCOME, label: 'Pemasukan' },
];

export interface RecurringManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  categories: CategoryMap;
}

export function RecurringManager({ isOpen, onClose, user, categories }: RecurringManagerProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const fetcher = useCallback(() => getRecurringTransactions(user.id), [user.id]);
  const { items: recurring, loading, mutate } = useResourceList<RecurringTransaction>(fetcher, isOpen);

  useEffect(() => {
    if (isOpen && !category && categories?.expense?.length) {
      setCategory(categories.expense[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !amount || !category) return;
    mutate(async () => {
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
    }, 'Gagal menyimpan langganan');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Langganan (Otomatis)">
      <div className="mb-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 border-4 border-border rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h4 className="font-bold">Tambah Langganan Baru</h4>

          <Input
            label="Nama (Mis: Spotify, KPR)"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <Input
              label="Nominal (Rp)"
              type="text"
              value={amount}
              onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
              required
            />
            <Select
              label="Siklus"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              options={FREQUENCY_OPTIONS}
            />
            <Select
              label="Tipe"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={toCategoryOptions(categories, type)}
              required
            />
          </div>

          <Input
            label="Mulai Tanggal"
            className="mt-2"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

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
          <div className="flex flex-col gap-3" style={{ maxHeight: '16rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {recurring.map((r) => (
              <ListRow key={r.id}>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-sm text-secondary">
                    {getCategoryLabel(categories, r.type, r.category)} • <span className={r.type === 'income' ? 'text-success font-bold' : 'text-danger font-bold'}>{formatIDR(r.amount)}</span> / {r.frequency === 'monthly' ? 'Bulan' : r.frequency}
                  </div>
                  <div className="text-xs text-secondary mt-1">Jadwal berikut: {r.next_date}</div>
                </div>
                <ConfirmDeleteButton
                  triggerLabel="Setop"
                  className="text-xs px-3 py-1"
                  onConfirm={() => mutate(() => deleteRecurringTransaction(r.id))}
                  title="Hentikan Langganan?"
                  description="Langganan otomatis ini akan dihentikan dan dihapus."
                />
              </ListRow>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
