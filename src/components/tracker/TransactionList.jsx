import React, { useState, useEffect } from 'react';
import { Button, EmptyState } from '../ui';
import { formatCurrency } from '../../utils/format';
import { TRANSACTION_TYPES } from '../../utils/constants';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export function TransactionList({ title, transactions, onDelete, onEdit, onToggleType, type }) {
  const [visibleCount, setVisibleCount] = useState(5);

  // Reset visible count when transactions change (e.g., changing month)
  useEffect(() => {
    setVisibleCount(5);
  }, [transactions]);

  const getTypeLabel = (tType) => {
    return tType === TRANSACTION_TYPES.INCOME ? 'Pemasukan' : 'Pengeluaran';
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const visibleTransactions = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  return (
    <div className="transaction-group">
      <h3 className="flex items-center gap-2">
        {type === TRANSACTION_TYPES.INCOME ? <ArrowDownCircle className="text-income" size={20} /> : <ArrowUpCircle className="text-expense" size={20} />}
        {title}
      </h3>
      
      {transactions.length === 0 ? (
        <EmptyState 
          message="Tidak ada transaksi" 
          subMessage={`Belum ada ${title.toLowerCase()} untuk periode ini.`} 
        />
      ) : (
        <div className="transaction-list-col">
          {visibleTransactions.map(t => (
            <div key={t.id} className={`transaction-item ${type} flex-col p-4`} style={{ alignItems: 'flex-start' }}>
              <div className="transaction-info w-full mb-4">
                <span className="transaction-title text-primary font-bold mb-1" style={{ fontSize: '1.125rem' }}>{t.title}</span>
                <span className="transaction-amount font-semibold" style={{ fontSize: '1.25rem' }}>{formatCurrency(t.amount)}</span>
                <div className="flex items-center gap-3 mt-2 text-sm text-secondary">
                  <span>📅 {t.date}</span>
                  <span>•</span>
                  <span>{getTypeLabel(t.type)}</span>
                </div>
              </div>
              <div className="transaction-actions flex gap-2 w-full justify-end border-t border-border pt-3 mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => onToggleType(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  Ubah Tipe
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => onDelete(t.id)}
                  className="btn-action-small"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={handleLoadMore} className="w-full">
                Lihat Lebih Banyak ({transactions.length - visibleCount} lagi)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
