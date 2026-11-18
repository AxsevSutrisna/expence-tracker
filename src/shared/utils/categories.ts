import type { Category, CategoryMap, TransactionType } from '@shared/types';

/** Cari kategori berdasarkan id dalam daftar sebuah tipe transaksi. */
export function findCategory(
  categories: CategoryMap,
  type: TransactionType,
  id: string | null | undefined
): Category | undefined {
  return categories?.[type]?.find((c) => c.id === id);
}

/**
 * Label tampilan kategori: "emoji label" untuk kategori kustom, atau label bawaan.
 * Jika kategori tidak ditemukan, kembalikan id apa adanya.
 */
export function getCategoryLabel(
  categories: CategoryMap,
  type: TransactionType,
  id: string | null | undefined
): string {
  const cat = findCategory(categories, type, id);
  if (!cat) return id ?? '';
  return cat.emoji ? `${cat.emoji} ${cat.label}` : cat.label;
}
