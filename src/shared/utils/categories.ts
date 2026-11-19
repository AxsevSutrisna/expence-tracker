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
 * Cari kategori berdasarkan id; bila tidak ketemu, jatuh ke item terakhir pada
 * daftar tipe tersebut (konvensinya kategori "Lainnya"). `undefined` bila daftar kosong.
 */
export function findCategoryWithFallback(
  categories: CategoryMap,
  type: TransactionType,
  id: string | null | undefined
): Category | undefined {
  const list = categories?.[type];
  if (!list || list.length === 0) return undefined;
  return list.find((c) => c.id === id) ?? list[list.length - 1];
}

/**
 * Label tampilan kategori: "emoji label" bila ada emoji, atau label bawaan.
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

/** Bangun daftar opsi `<Select>` dari kategori sebuah tipe (dengan emoji bila ada). */
export function toCategoryOptions(
  categories: CategoryMap,
  type: TransactionType
): Array<{ value: string; label: string }> {
  return (categories?.[type] ?? []).map((c) => ({
    value: c.id,
    label: c.emoji ? `${c.emoji} ${c.label}` : c.label,
  }));
}
