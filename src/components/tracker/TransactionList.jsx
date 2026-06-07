import React from 'react';
import { Button } from '../ui';
import { formatCurrency } from '../../utils/format';
import { TRANSACTION_TYPES } from '../../utils/constants';

export function TransactionList({ title, transactions, onDelete, onEdit, onToggleType, type }) {
  const getTypeLabel = (tType) => {
    return tType === TRANSACTION_TYPES.INCOME ? 'Pemasukan' : 'Pengeluaran';
  };

  return (
    <div className="transaction-group">
      <h3>{title}</h3>
      {transactions.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">
          Tidak ada data.
        </p>
      ) : (
        <div className="transaction-list-col">
          {transactions.map(t => (
            <div key={t.id} className={`transaction-item ${type} flex-col p-3`} style={{ alignItems: 'flex-start' }}>
              <div className="transaction-info w-full mb-4">
                <span className="transaction-title text-primary font-bold mb-2" style={{ fontSize: '1.125rem' }}>{t.title}</span>
                <span className="transaction-amount">Nominal: {formatCurrency(t.amount)}</span>
                <span className="transaction-amount">Tanggal: {t.date}</span>
                <span className="transaction-amount">Tipe: {getTypeLabel(t.type)}</span>
              </div>
              <div className="transaction-actions flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onToggleType(t)}
                  className="btn-action-small"
                >
                  Ubah Tipe
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(t)}
                  className="btn-action-small"
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onDelete(t.id)}
                  className="btn-action-small"
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
