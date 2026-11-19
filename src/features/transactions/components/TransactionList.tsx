import { useState, useEffect } from 'react';
import {
  Button,
  EmptyState,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui';
import { formatCurrency } from '@shared/utils/format';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { Category, CategoryMap, Transaction, TransactionType } from '@shared/types';

export interface TransactionListProps {
  title: string;
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onToggleType: (transaction: Transaction) => void;
  type: TransactionType;
  categories: CategoryMap;
}

export function TransactionList({
  title,
  transactions,
  onDelete,
  onEdit,
  onToggleType,
  type,
  categories,
}: TransactionListProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  // Reset visible count when transactions change (e.g., changing month)
  useEffect(() => {
    setVisibleCount(5);
  }, [transactions]);

  const getCategoryData = (
    tType: TransactionType | undefined | null,
    tCategoryId: string | undefined | null
  ): Category | null => {
    if (!tType || !categories[tType]) return null;
    const list = categories[tType];
    return list.find((c) => c.id === tCategoryId) || list[list.length - 1]; // Fallback to 'Lainnya'
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 5);
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
          {visibleTransactions.map((t) => (
            <div key={t.id} className={`transaction-item ${type} flex-col p-4`} style={{ alignItems: 'flex-start' }}>
              <div className="transaction-info" style={{ width: '100%', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {(() => {
                    const catData = getCategoryData(t.type, t.category);
                    const Icon = catData && !catData.isCustom ? catData.icon : null;
                    const iconColor = catData?.color || (t.type === TRANSACTION_TYPES.INCOME ? '#059669' : '#dc2626');
                    const isCustomCat = catData && catData.isCustom;
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
                          flexShrink: 0,
                          fontSize: isCustomCat ? '1.5rem' : 'inherit',
                        }}
                      >
                        {isCustomCat ? <span>{catData!.emoji}</span> : (Icon ? <Icon size={24} /> : (t.type === TRANSACTION_TYPES.INCOME ? <ArrowDownCircle size={24} /> : <ArrowUpCircle size={24} />))}
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="transaction-title text-primary font-bold" style={{ fontSize: '1.25rem' }}>{t.title}</span>
                    <span className="text-xs text-secondary font-medium">{getCategoryData(t.type, t.category)?.label || 'Tanpa Kategori'}</span>
                  </div>
                </div>
                <span className="transaction-amount font-black" style={{ fontSize: '1.5rem', display: 'block' }}>{formatCurrency(t.amount)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <span>{t.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%', justifyContent: 'flex-end', borderTop: '4px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => onToggleType(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                >
                  Ubah Tipe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEdit(t)}
                  className="btn-action-small"
                  style={{ fontSize: '0.75rem', padding: '8px 12px' }}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="danger"
                      className="btn-action-small"
                      style={{ fontSize: '0.75rem', padding: '8px 12px' }}
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
