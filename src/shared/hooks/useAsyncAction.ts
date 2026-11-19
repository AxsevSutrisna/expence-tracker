import { useCallback, useState } from 'react';

export interface UseAsyncActionResult {
  loading: boolean;
  /**
   * Jalankan sebuah aksi async dengan penanganan loading + error yang seragam.
   * Bila gagal: error di-log, dan `errorMessage` (bila ada) ditampilkan via alert.
   */
  run: (action: () => Promise<unknown>, errorMessage?: string) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Primitif kecil untuk pola "set loading → try → catch(log/alert) → finally"
 * yang sebelumnya diulang di tiap handler simpan/hapus.
 */
export function useAsyncAction(): UseAsyncActionResult {
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (action: () => Promise<unknown>, errorMessage?: string) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      console.error(error);
      if (errorMessage) alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, run, setLoading };
}
