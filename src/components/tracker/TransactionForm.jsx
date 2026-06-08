import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button } from '../ui';
import { TRANSACTION_TYPES } from '../../utils/constants';

export function TransactionForm({ onSubmit, loading, editingTransaction, onCancelEdit }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: TRANSACTION_TYPES.INCOME
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        title: editingTransaction.title,
        amount: editingTransaction.amount ? `Rp. ${editingTransaction.amount.toLocaleString('id-ID')}` : '',
        date: editingTransaction.date,
        type: editingTransaction.type
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: TRANSACTION_TYPES.INCOME
      });
    }
  }, [editingTransaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;

    const numericAmount = parseFloat(formData.amount.toString().replace(/\D/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    await onSubmit({
      title: formData.title,
      amount: numericAmount,
      date: formData.date,
      type: formData.type
    });

    // Reset form after submit is handled by useEffect if editingTransaction changes
    // But if it's just adding, we reset it manually
    if (!editingTransaction) {
      setFormData(prev => ({
        ...prev,
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
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

      <Select
        label="Klasifikasi"
        id="type"
        value={formData.type}
        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
        options={[
          { value: TRANSACTION_TYPES.INCOME, label: 'Uang Masuk (+)' },
          { value: TRANSACTION_TYPES.EXPENSE, label: 'Uang Keluar (-)' }
        ]}
        required
      />

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
