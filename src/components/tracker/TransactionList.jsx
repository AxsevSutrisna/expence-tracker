import React, { useState, useEffect } from 'react';
import { Button, EmptyState } from '../ui';
import { formatCurrency } from '../../utils/format';
import { TRANSACTION_TYPES, CATEGORIES } from '../../utils/constants';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';

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
                <span className="transaction-amount font-black" style={{ fontSize: '1.5rem', display: 'block' }}>{formatCurrency(t.amount)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <span>{t.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end', borderTop: '4px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => onToggleType(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                >
                  Ubah Tipe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEdit(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="danger"
                      className="btn-action-small"
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    >
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Data transaksi ini akan dihapus secara permanen dari catatan Anda.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(t.id)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
