import React, { useState } from 'react';
import { Card, Input, Select, Button } from '../ui';

export function TransactionForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.date) return;
    
    await onSubmit({
      title: formData.title,
      amount: parseFloat(formData.amount),
      date: formData.date,
      type: formData.type
    });
    
    // Reset form after submit
    setFormData(prev => ({ ...prev, title: '', amount: '' }));
  };

  return (
    <Card>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>
        Tambah Pencatatan Baru
      </h2>
      <form onSubmit={handleSubmit} className="form-row">
        <Input 
          label="Keterangan" 
          id="title" 
          placeholder="Misal: Makan siang..." 
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required 
        />
        
        <Input 
          label="Nominal (Rp)" 
          id="amount" 
          type="number"
          placeholder="50000" 
          min="1"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
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
            { value: 'income', label: 'Uang Masuk (+)' },
            { value: 'expense', label: 'Uang Keluar (-)' }
          ]}
          required
        />
        
        <Button type="submit" variant="primary" disabled={loading} style={{ height: '46px', whiteSpace: 'nowrap' }}>
          {loading ? 'Menyimpan...' : 'Catat Sekarang'}
        </Button>
      </form>
    </Card>
  );
}
