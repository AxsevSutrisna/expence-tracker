import React, { useState, useEffect } from 'react';
import { Button, EmptyState } from '../ui';
import { formatCurrency } from '../../utils/format';
import { TRANSACTION_TYPES, CATEGORIES } from '../../utils/constants';
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

  const getCategoryData = (tType, tCategoryId) => {
    if (!tType || !CATEGORIES[tType]) return null;
    const list = CATEGORIES[tType];
    return list.find(c => c.id === tCategoryId) || list[list.length - 1]; // Fallback to 'Lainnya'
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  const visibleTransactions = transactions.slice(0, visibleCount);
  const hasMore = visibleCount < transactions.length;

  return (
    <div className="transaction-group">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
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
              <div className="transaction-info" style={{ width: '100%', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {(() => {
                    const catData = getCategoryData(t.type, t.category);
                    const Icon = catData ? catData.icon : (t.type === TRANSACTION_TYPES.INCOME ? ArrowDownCircle : ArrowUpCircle);
                    const iconColor = catData ? catData.color : (t.type === TRANSACTION_TYPES.INCOME ? '#059669' : '#dc2626');
                    return (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: '50%',
                          width: 44, 
                          height: 44, 
                          backgroundColor: `${iconColor}25`, 
                          color: iconColor, 
                          flexShrink: 0 
                        }}
                      >
                        <Icon size={24} />
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="transaction-title text-primary font-bold" style={{ fontSize: '1.125rem' }}>{t.title}</span>
                    <span className="text-xs text-secondary font-medium">{getCategoryData(t.type, t.category)?.label || 'Tanpa Kategori'}</span>
                  </div>
                </div>
                <span className="transaction-amount font-semibold" style={{ fontSize: '1.25rem', display: 'block' }}>{formatCurrency(t.amount)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <span>{t.date}</span>
                  <span>•</span>
                  <span>{getTypeLabel(t.type)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
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
