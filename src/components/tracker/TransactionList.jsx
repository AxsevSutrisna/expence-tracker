import React from 'react';
import { Button } from '../ui';
import { Trash2 } from 'lucide-react';

export function TransactionList({ title, transactions, onDelete, type }) {
  const formatCurrency = (amount) => {
    return 'Rp' + new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount);
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
            <div key={t.id} className={`transaction-item ${type}`}>
              <div className="transaction-info">
                <span className="transaction-title">{t.title}</span>
                <span className="transaction-amount">Nominal: {formatCurrency(t.amount)}</span>
              </div>
              <div className="transaction-actions">
                <Button 
                  variant="outline" 
                  className="btn-icon" 
                  style={{ border: 'none', color: '#ef4444' }}
                  onClick={() => onDelete(t.id)}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
