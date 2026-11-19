import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from './useAsyncAction';

export interface UseResourceListResult<T> {
  items: T[];
  loading: boolean;
  /** Muat ulang daftar dari sumber data. */
  reload: () => Promise<void>;
  /**
   * Jalankan aksi mutasi (insert/update/delete) lalu muat ulang daftar.
   * Menangani loading, error logging, dan `alert` opsional secara seragam.
   */
  mutate: (action: () => Promise<unknown>, errorMessage?: string) => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Hook generik untuk daftar sumber daya ber-CRUD (pola yang sama di manajer
 * Budget/Langganan): memegang `items` + `loading`, memuat saat `enabled`, dan
 * menyediakan `mutate` untuk aksi yang diikuti reload otomatis.
 *
 * `fetcher` sebaiknya dibungkus `useCallback` agar efek muat tidak berjalan tiap render.
 */
export function useResourceList<T>(
  fetcher: () => Promise<T[]>,
  enabled: boolean
): UseResourceListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const { loading, run } = useAsyncAction();

  const reload = useCallback(
    () => run(async () => setItems(await fetcher())),
    [run, fetcher]
  );

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  const mutate = useCallback(
    (action: () => Promise<unknown>, errorMessage?: string) =>
      run(async () => {
        await action();
        setItems(await fetcher());
      }, errorMessage),
    [run, fetcher]
  );

  return { items, loading, reload, mutate, setItems };
}
