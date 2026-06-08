import React from 'react';
import { Wallet } from 'lucide-react';

export function EmptyState({ message, subMessage }) {
  return (
    <div className="flex-col items-center justify-center p-8 text-center animate-in" style={{ gap: '1rem', opacity: 0.8 }}>
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-full)', color: 'var(--color-text-muted)' }}>
        <Wallet size={48} strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="text-primary font-semibold" style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{message || 'Tidak ada data'}</h4>
        <p className="text-sm text-secondary">{subMessage || 'Belum ada catatan transaksi untuk periode ini.'}</p>
      </div>
    </div>
  );
}
