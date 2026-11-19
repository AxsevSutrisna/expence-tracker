import type { HTMLAttributes } from 'react';

export type ListRowProps = HTMLAttributes<HTMLDivElement>;

/**
 * Baris daftar standar (kartu kecil): border, radius, dan surface konsisten —
 * dipakai di manajer Budget/Langganan/Kategori agar tidak menulis ulang markup.
 */
export function ListRow({ className = '', children, ...props }: ListRowProps) {
  return (
    <div className={`list-row ${className}`} {...props}>
      {children}
    </div>
  );
}
