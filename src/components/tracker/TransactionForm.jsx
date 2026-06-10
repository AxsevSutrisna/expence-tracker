import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Calendar, Popover, PopoverContent, PopoverTrigger } from '../ui';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { TRANSACTION_TYPES, CATEGORIES } from '../../utils/constants';

export function TransactionForm({ onSubmit, loading, editingTransaction, onCancelEdit, categories }) {
  const defaultIncomeCat = categories?.income?.[0]?.id || 'other_income';
  const defaultExpenseCat = categories?.expense?.[0]?.id || 'other_expense';

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: TRANSACTION_TYPES.EXPENSE,
    category: defaultExpenseCat
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        title: editingTransaction.title,
        amount: editingTransaction.amount ? `Rp. ${editingTransaction.amount.toLocaleString('id-ID')}` : '',
        date: editingTransaction.date,
        type: editingTransaction.type,
        category: editingTransaction.category || (editingTransaction.type === TRANSACTION_TYPES.INCOME ? defaultIncomeCat : defaultExpenseCat)
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: TRANSACTION_TYPES.EXPENSE,
        category: defaultExpenseCat
      });
    }
  }, [editingTransaction, categories]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      category: newType === TRANSACTION_TYPES.INCOME ? defaultIncomeCat : defaultExpenseCat
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;

    const numericAmount = parseFloat(formData.amount.toString().replace(/\D/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    await onSubmit({
      title: formData.title,
      amount: numericAmount,
      date: formData.date,
      type: formData.type,
      category: formData.category
    });

    // Reset form after submit is handled by useEffect if editingTransaction changes
    // But if it's just adding, we reset it manually
    if (!editingTransaction) {
      setFormData(prev => ({
        ...prev,
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        // keep type and category same for consecutive adding
      }));
    }
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');

    if (!digits) {
      setFormData(prev => ({ ...prev, amount: '' }));
      return;
    }

    const formatted = `Rp. ${parseInt(digits, 10).toLocaleString('id-ID')}`;
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-4">
      <Input
        label="Keterangan *"
        id="title"
        placeholder="Misal: Makan siang..."
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        required
      />

      <Input
        label="Nominal (Rp) *"
        id="amount"
        type="text"
        placeholder="Rp. 50.000"
        value={formData.amount}
        onChange={handleAmountChange}
        required
      />

      <div className="input-group">
        <label className="input-label">Tanggal</label>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
              <CalendarIcon style={{ width: '1rem', height: '1rem', opacity: 0.6 }} />
              {formData.date ? format(new Date(formData.date), "dd/MM/yyyy") : <span>Pilih tanggal</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={{ padding: 0 }}>
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={(d) => {
                if (d) {
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="form-grid-2">
        <Select
          label="Klasifikasi"
          id="type"
          value={formData.type}
          onChange={handleTypeChange}
          options={[
            { value: TRANSACTION_TYPES.EXPENSE, label: 'Uang Keluar (-)' },
            { value: TRANSACTION_TYPES.INCOME, label: 'Uang Masuk (+)' }
          ]}
          required
        />

        <Select
          label="Kategori"
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          options={categories[formData.type]?.map(c => ({
            value: c.id,
            label: c.isCustom ? `${c.emoji} ${c.label}` : c.label
          })) || []}
          required
        />
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" disabled={loading} className="w-full" style={{ height: '46px' }}>
          {loading ? 'Menyimpan...' : (editingTransaction ? 'Update' : 'Catat Sekarang')}
        </Button>
        {editingTransaction && (
          <Button type="button" variant="outline" onClick={onCancelEdit} disabled={loading} className="w-full" style={{ height: '46px' }}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
