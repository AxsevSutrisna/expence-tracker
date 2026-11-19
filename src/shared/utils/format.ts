/** Format angka menjadi mata uang Rupiah (mis. "Rp 50.000"). */
export const formatCurrency = (amount: number): string => {
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount);
};

/** Format angka memakai gaya mata uang IDR Intl (mis. "Rp 50.000"). */
export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/** Format input ber-mask Rupiah dari teks mentah: "50000x" -> "Rp. 50.000" (string kosong bila tanpa digit). */
export const formatRupiahInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  return digits ? `Rp. ${parseInt(digits, 10).toLocaleString('id-ID')}` : '';
};

/** Ambil nilai numerik dari string ber-mask Rupiah ("Rp. 50.000" -> 50000; 0 bila kosong). */
export const parseRupiah = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

/** Format ringkas untuk label/progress (mis. "Rp 1.5Jt", "Rp 500Rb", "Rp 750"). */
export const formatCompactIDR = (amount: number): string => {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}Rb`;
  return `Rp ${amount}`;
};
