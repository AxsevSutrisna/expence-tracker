import { supabase } from '@shared/lib/supabase';

export interface TelegramLinkInfo {
  /** true bila akun Telegram sudah terhubung dengan user ini. */
  linked: boolean;
  /** Kode sekali-pakai untuk dikirim ke bot (bila belum terhubung). */
  code?: string;
  /** Username bot (tanpa "@"). */
  botUsername?: string;
  /** Deep link Telegram yang langsung membawa kode (bila tersedia). */
  deepLink?: string | null;
  /** Masa berlaku kode dalam detik. */
  expiresInSeconds?: number;
}

/**
 * Minta kode hubungkan Telegram untuk user yang sedang login.
 * Memanggil Edge Function `telegram-link-code` (JWT dikirim otomatis oleh supabase-js).
 */
export const requestTelegramLinkCode = async (): Promise<TelegramLinkInfo> => {
  const { data, error } = await supabase.functions.invoke<TelegramLinkInfo>('telegram-link-code', { body: {} });
  if (error) throw error;
  if (!data) throw new Error('Tidak ada respons dari server.');
  return data;
};
