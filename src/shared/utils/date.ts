/** Dua digit berpadding nol (mis. 3 -> "03"). */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Jumlah hari dalam sebuah bulan (month 1-12). */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

/** "YYYY-MM-DD" untuk hari tertentu dalam bulan; hari di-clamp ke panjang bulan. */
export const dateInMonth = (year: number, month: number, day: number): string => {
  const d = Math.min(Math.max(day, 1), daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(d)}`;
};

/** Ambil komponen "hari" dari string tanggal "YYYY-MM-DD". */
export const dayOfMonth = (isoDate: string): number => parseInt(isoDate.split('-')[2], 10) || 1;

/**
 * Rentang tanggal setengah-terbuka [start, end) untuk sebuah bulan (month 1-12):
 * `start` = tanggal 1 bulan itu, `end` = tanggal 1 bulan berikutnya.
 */
export const monthRange = (year: number, month: number): { start: string; end: string } => {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return { start: `${year}-${pad2(month)}-01`, end: `${nextYear}-${pad2(nextMonth)}-01` };
};

/** Bulan sebelumnya (month 1-12) beserta tahunnya. */
export const getPreviousMonth = (month: number, year: number): { month: number; year: number } => ({
  month: month === 1 ? 12 : month - 1,
  year: month === 1 ? year - 1 : year,
});

/** Tanggal hari ini sebagai "YYYY-MM-DD" (waktu lokal). */
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** Selisih hari antara dua tanggal "YYYY-MM-DD" (toISO - fromISO; negatif bila fromISO lebih akhir). */
export const daysBetween = (fromISO: string, toISO: string): number => {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
};

/** Awal minggu (Senin) dari sebuah tanggal "YYYY-MM-DD". */
export const startOfWeekISO = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7; // 0=Sen..6=Min
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
};

/** Nama bulan Bahasa Indonesia (index 0 = Januari). Sumber tunggal — jangan duplikasi. */
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

/** Nama bulan dari nomor 1-12 (string kosong bila di luar rentang). */
export const monthName = (month: number): string => MONTH_NAMES[month - 1] ?? '';

/** Opsi {value,label} untuk dropdown bulan (value 1-12). */
export const MONTH_OPTIONS: Array<{ value: number; label: string }> = MONTH_NAMES.map(
  (label, i) => ({ value: i + 1, label })
);

/** "YYYY-MM-DD" → "12 Nov 2026" (nama bulan singkat ID). */
export const formatDateShort = (iso?: string | null): string => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${monthName(m).slice(0, 3)} ${y}`;
};
