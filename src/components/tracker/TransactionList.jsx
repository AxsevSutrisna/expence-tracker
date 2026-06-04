import React from 'react';
import { Button } from '../ui';

export function TransactionList({ title, transactions, onDelete, onEdit, onToggleType, type }) {
  const formatCurrency = (amount) => {
    return 'Rp' + new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTypeLabel = (tType) => {
    return tType === 'income' ? 'Pemasukan' : 'Pengeluaran';
  };

  return (
    <div className="transaction-group">
      <h3>{title}</h3>
      {transactions.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
          Tidak ada data.
        </p>
      ) : (
        <div className="transaction-list-col">
          {transactions.map(t => (
            <div key={t.id} className={`transaction-item ${type}`} style={{ alignItems: 'flex-start', flexDirection: 'column', padding: '1.25rem' }}>
              <div className="transaction-info" style={{ width: '100%', marginBottom: '1rem' }}>
                <span className="transaction-title" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t.title}</span>
                <span className="transaction-amount">Nominal: {formatCurrency(t.amount)}</span>
                <span className="transaction-amount">Tanggal: {t.date}</span>
                <span className="transaction-amount">Tipe: {getTypeLabel(t.type)}</span>
              </div>
              <div className="transaction-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  variant="outline" 
                  onClick={() => onToggleType(t)}
                  style={{ border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  Ubah Tipe
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(t)}
                  style={{ border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onDelete(t.id)}
                  style={{ border: 'none', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
