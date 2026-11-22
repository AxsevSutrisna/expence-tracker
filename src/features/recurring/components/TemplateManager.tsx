import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { CalendarCheck } from 'lucide-react';
import { Button, Input, Select, Modal, ConfirmDeleteButton, ListRow } from '@shared/ui';
import {
  getRecurringTransactions,
  addRecurringTransaction,
  deleteRecurringTransaction,
  applyTemplateToMonth,
  nextMonthlyDate,
} from '../services/recurringService';
import { formatIDR, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { getCategoryLabel, toCategoryOptions } from '@shared/utils/categories';
import { dayOfMonth } from '@shared/utils/date';
import { useResourceList } from '@shared/hooks/useResourceList';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { CategoryMap, RecurringTransaction, TransactionType } from '@shared/types';

const TYPE_OPTIONS = [
  { value: TRANSACTION_TYPES.EXPENSE, label: 'Pengeluaran' },
  { value: TRANSACTION_TYPES.INCOME, label: 'Pemasukan' },
];

export interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  categories: CategoryMap;
  selectedMonth: number;
  selectedYear: number;
  /** Label periode aktif, mis. "November 2026" — untuk teks tombol terapkan. */
  monthLabel: string;
  /** Dipanggil setelah template diterapkan agar dashboard memuat ulang transaksi. */
  onApplied: () => Promise<void> | void;
}

export function TemplateManager({
  isOpen,
  onClose,
  user,
  categories,
  selectedMonth,
  selectedYear,
  monthLabel,
  onApplied,
}: TemplateManagerProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TRANSACTION_TYPES.EXPENSE);
  const [category, setCategory] = useState('');
  const [day, setDay] = useState(1);

  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  const fetcher = useCallback(() => getRecurringTransactions(user.id), [user.id]);
  const { items, loading, mutate } = useResourceList<RecurringTransaction>(fetcher, isOpen);

  useEffect(() => {
    if (isOpen && !category && categories?.expense?.length) {
      setCategory(categories.expense[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categories]);

  // Hanya item bulanan aktif yang menjadi "template bulanan"
  const monthly = items.filter((i) => i.frequency === 'monthly' && i.is_active);
  const incomeItems = monthly.filter((i) => i.type === TRANSACTION_TYPES.INCOME);
  const expenseItems = monthly.filter((i) => i.type === TRANSACTION_TYPES.EXPENSE);
  const incomeTotal = incomeItems.reduce((s, i) => s + i.amount, 0);
  const expenseTotal = expenseItems.reduce((s, i) => s + i.amount, 0);
  const projected = incomeTotal - expenseTotal;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !amount || !category) return;
    const d = nextMonthlyDate(day);
    mutate(async () => {
      await addRecurringTransaction(user.id, {
        title,
        amount: parseRupiah(amount),
        type,
        category,
        frequency: 'monthly',
        start_date: d,
        next_date: d,
      });
      setTitle('');
      setAmount('');
    }, 'Gagal menyimpan item template');
  };

  const handleApply = async () => {
    setApplying(true);
    setApplyMsg('');
    try {
      const count = await applyTemplateToMonth(user.id, selectedYear, selectedMonth);
      if (count > 0) {
        setApplyMsg(`✓ ${count} transaksi dibuat untuk ${monthLabel}.`);
        await onApplied();
      } else {
        setApplyMsg(`Semua item template sudah ada di ${monthLabel}.`);
      }
    } catch (error) {
      console.error(error);
      setApplyMsg('Gagal menerapkan template. Coba lagi.');
    } finally {
      setApplying(false);
    }
  };

  const renderItem = (r: RecurringTransaction) => (
    <ListRow key={r.id}>
      <div style={{ minWidth: 0 }}>
        <div className="font-bold">{r.title}</div>
        <div className="text-sm text-secondary">
          {getCategoryLabel(categories, r.type, r.category)} •{' '}
          <span className={r.type === 'income' ? 'text-success font-bold' : 'text-danger font-bold'}>
            {formatIDR(r.amount)}
          </span>
        </div>
        <div className="text-xs text-secondary mt-1">Dibuat tiap tanggal {dayOfMonth(r.start_date)}</div>
      </div>
      <ConfirmDeleteButton
        className="text-xs px-3 py-1"
        onConfirm={() => mutate(() => deleteRecurringTransaction(r.id))}
        title="Hapus dari Template?"
        description="Pos ini tidak akan dibuat otomatis lagi. Transaksi yang sudah tercatat tidak terhapus."
      />
    </ListRow>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Bulanan"
      description="Setel pemasukan & pengeluaran tetap sekali — tiap bulan baru dibuat otomatis. Transaksi manual tetap bisa ditambah kapan saja."
    >
      {/* Ringkasan proyeksi + tombol terapkan */}
      <div className="template-summary mb-6">
        <div className="template-summary-grid">
          <div>
            <span className="template-summary-label">Pemasukan / bln</span>
            <strong className="text-income">{formatIDR(incomeTotal)}</strong>
          </div>
          <div>
            <span className="template-summary-label">Pengeluaran / bln</span>
            <strong className="text-expense">{formatIDR(expenseTotal)}</strong>
          </div>
          <div>
            <span className="template-summary-label">Proyeksi Saldo</span>
            <strong style={{ color: projected >= 0 ? 'var(--color-text-income)' : 'var(--color-text-expense)' }}>
              {formatIDR(projected)}
            </strong>
          </div>
        </div>
        <Button
          type="button"
          variant="dark"
          className="w-full mt-4"
          onClick={handleApply}
          disabled={applying || monthly.length === 0}
        >
          <CalendarCheck size={18} />
          {applying ? 'Menerapkan...' : `Terapkan ke ${monthLabel}`}
        </Button>
        {applyMsg && <p className="input-hint mt-2" style={{ textAlign: 'center' }}>{applyMsg}</p>}
      </div>

      {/* Form tambah pos template */}
      <div className="mb-6">
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-4 border-4 border-border rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h4 className="font-bold">Tambah Pos Tetap</h4>

          <Input
            label="Nama Pos"
            type="text"
            placeholder="Misal: Gaji, Uang Makan, Bensin"
            hint="Nama yang muncul tiap transaksi dibuat otomatis."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <Input
              label="Nominal (Rp)"
              type="text"
              inputMode="numeric"
              placeholder="Rp. 500.000"
              hint="Jumlah tiap bulan."
              value={amount}
              onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
              required
            />
            <Input
              label="Tanggal (hari)"
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              hint="Hari dalam bulan saat pos ini dibuat (1–28)."
              value={day}
              onChange={(e) => setDay(Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              required
            />
            <Select
              label="Tipe"
              hint="Pemasukan atau pengeluaran."
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              options={TYPE_OPTIONS}
            />
            <Select
              label="Kategori"
              hint="Kelompok untuk grafik & laporan."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={toCategoryOptions(categories, type)}
              required
            />
          </div>

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Tambah ke Template'}
          </Button>
        </form>
      </div>

      {/* Daftar pos template */}
      <div>
        <h4 className="font-bold mb-4">Isi Template Bulanan</h4>
        {monthly.length === 0 ? (
          <p className="text-sm text-secondary">Belum ada pos tetap. Tambahkan gaji & pengeluaran rutinmu di atas.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {incomeItems.length > 0 && (
              <div className="flex flex-col gap-3">
                <h5 className="text-sm font-bold text-income uppercase">Pemasukan Tetap</h5>
                {incomeItems.map(renderItem)}
              </div>
            )}
            {expenseItems.length > 0 && (
              <div className="flex flex-col gap-3">
                <h5 className="text-sm font-bold text-expense uppercase">Pengeluaran Tetap</h5>
                {expenseItems.map(renderItem)}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
