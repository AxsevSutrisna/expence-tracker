import { useState, useEffect } from 'react';
import { Input, Select, Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '@shared/ui';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { toCategoryOptions } from '@shared/utils/categories';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type {
  CategoryMap,
  ReceiptScanResult,
  Transaction,
  TransactionInput,
  TransactionType,
} from '@shared/types';
import { ReceiptScanner } from '@features/receipts';

interface FormState {
  title: string;
  amount: string;
  date: string;
  type: TransactionType;
  category: string;
  receiptUrl: string;
}

export interface TransactionFormProps {
  onSubmit: (data: TransactionInput) => Promise<void> | void;
  loading: boolean;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  categories: CategoryMap;
}

export function TransactionForm({
  onSubmit,
  loading,
  editingTransaction,
  onCancelEdit,
  categories,
}: TransactionFormProps) {
  const defaultIncomeCat = categories?.income?.[0]?.id || 'other_income';
  const defaultExpenseCat = categories?.expense?.[0]?.id || 'other_expense';

  const [formData, setFormData] = useState<FormState>({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: TRANSACTION_TYPES.EXPENSE,
    category: defaultExpenseCat,
    receiptUrl: '',
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        title: editingTransaction.title,
        amount: editingTransaction.amount ? formatRupiahInput(String(editingTransaction.amount)) : '',
        date: editingTransaction.date,
        type: editingTransaction.type,
        category:
          editingTransaction.category ||
          (editingTransaction.type === TRANSACTION_TYPES.INCOME ? defaultIncomeCat : defaultExpenseCat),
        receiptUrl: editingTransaction.receipt_url || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: TRANSACTION_TYPES.EXPENSE,
        category: defaultExpenseCat,
        receiptUrl: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction, categories]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TransactionType;
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newType === TRANSACTION_TYPES.INCOME ? defaultIncomeCat : defaultExpenseCat,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;

    const numericAmount = parseRupiah(formData.amount);
    if (numericAmount <= 0) return;

    await onSubmit({
      title: formData.title,
      amount: numericAmount,
      date: formData.date,
      type: formData.type,
      category: formData.category,
      receipt_url: formData.receiptUrl,
    });

    if (!editingTransaction) {
      setFormData((prev) => ({
        ...prev,
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receiptUrl: '',
        // keep type and category same for consecutive adding
      }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, amount: formatRupiahInput(e.target.value) }));
  };

  const handleScanSuccess = (scanData: ReceiptScanResult) => {
    // Determine the category to match available options or default
    let matchedCategory = defaultExpenseCat;
    if (scanData.category && categories?.expense) {
      const found = categories.expense.find(
        (c) =>
          c.id.toLowerCase().includes(scanData.category!.toLowerCase()) ||
          scanData.category!.toLowerCase().includes(c.id.toLowerCase())
      );
      if (found) matchedCategory = found.id;
    }

    setFormData((prev) => ({
      ...prev,
      title: scanData.title || prev.title,
      amount: scanData.amount ? formatRupiahInput(String(scanData.amount)) : prev.amount,
      date: scanData.date || prev.date,
      type: TRANSACTION_TYPES.EXPENSE, // Receipts are generally expenses
      category: matchedCategory,
      receiptUrl: scanData.receiptUrl || prev.receiptUrl,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-4">

      {!editingTransaction && (
        <ReceiptScanner onScanSuccess={handleScanSuccess} />
      )}

      {formData.receiptUrl && (
        <div className="mb-4 p-2 border rounded flex items-center gap-3" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
          <img
            src={formData.receiptUrl}
            alt="Receipt Preview"
            className="w-12 h-12 object-cover rounded border"
          />
          <div className="flex-1 text-sm text-secondary">
            Lampiran setruk berhasil ditambahkan
          </div>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, receiptUrl: '' }))}
            className="text-sm font-bold px-2 text-danger"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            Hapus
          </button>
        </div>
      )}

      <Input
        label="Keterangan *"
        id="title"
        placeholder="Misal: Makan siang..."
        hint="Nama singkat transaksi agar mudah dikenali di daftar."
        value={formData.title}
        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
        required
      />

      <Input
        label="Nominal (Rp) *"
        id="amount"
        type="text"
        inputMode="numeric"
        placeholder="Rp. 50.000"
        hint="Ketik angka saja — format Rupiah mengikuti otomatis."
        value={formData.amount}
        onChange={handleAmountChange}
        required
      />

      <div className="input-group">
        <label className="input-label" htmlFor="date-trigger">Tanggal</label>
        <Popover>
          <PopoverTrigger asChild>
            <button id="date-trigger" type="button" className="input-field" aria-describedby="date-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
              <CalendarIcon style={{ width: '1rem', height: '1rem', opacity: 0.6 }} />
              {formData.date ? format(new Date(formData.date), 'dd/MM/yyyy') : <span>Pilih tanggal</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={{ padding: 0 }}>
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={(d: Date | undefined) => {
                if (d) {
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setFormData((prev) => ({ ...prev, date: `${year}-${month}-${day}` }));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p id="date-hint" className="input-hint">Kapan transaksi ini terjadi (default: hari ini).</p>
      </div>

      <div className="form-grid-2">
        <Select
          label="Klasifikasi"
          id="type"
          hint="Uang Keluar = pengeluaran · Uang Masuk = pemasukan."
          value={formData.type}
          onChange={handleTypeChange}
          options={[
            { value: TRANSACTION_TYPES.EXPENSE, label: 'Uang Keluar (-)' },
            { value: TRANSACTION_TYPES.INCOME, label: 'Uang Masuk (+)' },
          ]}
          required
        />

        <Select
          label="Kategori"
          id="category"
          hint="Mengelompokkan transaksi untuk grafik & laporan."
          value={formData.category}
          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
          options={toCategoryOptions(categories, formData.type)}
          required
        />
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" disabled={loading} className="w-full" style={{ height: '48px' }}>
          {loading ? 'Menyimpan...' : (editingTransaction ? 'Update' : 'Catat Sekarang')}
        </Button>
        {editingTransaction && (
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={loading} className="w-full" style={{ height: '48px' }}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
