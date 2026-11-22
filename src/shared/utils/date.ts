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
