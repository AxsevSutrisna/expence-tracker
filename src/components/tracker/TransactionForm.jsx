import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '../ui';
import { TRANSACTION_TYPES, CATEGORIES } from '../../utils/constants';

export function TransactionForm({ onSubmit, loading, editingTransaction, onCancelEdit }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: TRANSACTION_TYPES.EXPENSE,
    category: CATEGORIES.expense[0].id
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        title: editingTransaction.title,
        amount: editingTransaction.amount ? `Rp. ${editingTransaction.amount.toLocaleString('id-ID')}` : '',
        date: editingTransaction.date,
        type: editingTransaction.type,
        category: editingTransaction.category || (editingTransaction.type === TRANSACTION_TYPES.INCOME ? CATEGORIES.income[0].id : CATEGORIES.expense[0].id)
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: TRANSACTION_TYPES.EXPENSE,
        category: CATEGORIES.expense[0].id
      });
    }
  }, [editingTransaction]);

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      category: newType === TRANSACTION_TYPES.INCOME ? CATEGORIES.income[0].id : CATEGORIES.expense[0].id
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

      <Input
        label="Tanggal"
        id="date"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
        required
      />

      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
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
          options={CATEGORIES[formData.type].map(c => ({ value: c.id, label: c.label }))}
          required
        />
      </div>

      <div className="flex items-end gap-2 mt-4">
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
