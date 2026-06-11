import React, { useState, useEffect } from 'react';
import { Button, Input, Modal } from '../ui';
import { getRecurringTransactions, addRecurringTransaction, deleteRecurringTransaction } from '../../lib/recurringService';
import { TRANSACTION_TYPES } from '../../utils/constants';

export function RecurringManager({ isOpen, onClose, user, categories }) {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState(TRANSACTION_TYPES.EXPENSE);
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState('monthly');
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
  }, [isOpen, user, categories]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !amount || !category) return;

    try {
      setLoading(true);
      const cleanAmount = amount.replace(/\D/g, '');
      
      // Calculate next_date based on start_date
      let nextDate = new Date(startDate);
      // For immediate creation, if start date is today or past, we don't necessarily increment it yet
      // The pending processor will handle it on next load if it's due.

      await addRecurringTransaction(user.id, {
        title,
        amount: parseInt(cleanAmount, 10),
        type,
        category,
        frequency,
        start_date: startDate,
        next_date: startDate // first trigger is the start date
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

  const handleDelete = async (id) => {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryLabel = (catId, catType) => {
    const cat = categories?.[catType]?.find(c => c.id === catId);
    if (!cat) return catId;
    return cat.emoji ? `${cat.emoji} ${cat.label}` : cat.label;
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
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmount(val ? `Rp. ${parseInt(val, 10).toLocaleString('id-ID')}` : '');
                }}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Siklus</label>
              <select className="input-field cursor-pointer" value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
                <option value="yearly">Tahunan</option>
                <option value="daily">Harian</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Tipe</label>
              <select className="input-field cursor-pointer" value={type} onChange={e => setType(e.target.value)}>
                <option value={TRANSACTION_TYPES.EXPENSE}>Pengeluaran</option>
                <option value={TRANSACTION_TYPES.INCOME}>Pemasukan</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Kategori</label>
              <select className="input-field cursor-pointer" value={category} onChange={e => setCategory(e.target.value)} required>
                {categories?.[type]?.map(c => (
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
            {recurring.map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 border-2 border-border rounded-md" style={{ backgroundColor: '#fff' }}>
                <div>
                  <div className="font-bold">{r.title}</div>
                  <div className="text-sm text-secondary">
                    {getCategoryLabel(r.category, r.type)} • <span className={r.type === 'income' ? 'text-success font-bold' : 'text-danger font-bold'}>{formatCurrency(r.amount)}</span> / {r.frequency === 'monthly' ? 'Bulan' : r.frequency}
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
