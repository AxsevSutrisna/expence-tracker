import { applyBudgets } from '@features/budgets/services/budgetService';
import { applyMonthlyTemplateItems } from '@features/recurring/services/recurringService';
import { sumExpensesByCategory } from '@shared/utils/transactions';
import type { CustomCategoryRow, Transaction, TransactionType } from '@shared/types';

/** Tiga "ember" induk mengikuti metode budgeting (mis. 50/30/20). */
export type BucketKey = 'needs' | 'wants' | 'savings';

/** Grup tampilan = bucket metode + grup khusus kategori kustom. */
export type GroupKey = BucketKey | 'custom';

/** Enam kategori rinci bawaan. */
export type PlannerCategoryKey = 'tetap' | 'pokok' | 'harian' | 'hiburan' | 'tabungan' | 'investasi';

/** Persentase per key (kategori bawaan ATAU id kategori kustom). */
export type Percentages = Record<string, number>;

export interface GroupDef {
  key: GroupKey;
  label: string;
  short: string;
  colorVar: string;
  ink: string;
}

export const BUCKETS: GroupDef[] = [
  { key: 'needs', label: 'Kebutuhan', short: 'Needs', colorVar: 'var(--plan-needs)', ink: '#ffffff' },
  { key: 'wants', label: 'Keinginan', short: 'Wants', colorVar: 'var(--plan-wants)', ink: '#0b0b0b' },
  { key: 'savings', label: 'Tabungan & Investasi', short: 'Savings', colorVar: 'var(--plan-savings)', ink: '#ffffff' },
];

export const CUSTOM_GROUP: GroupDef = {
  key: 'custom',
  label: 'Kategori Kustom',
  short: 'Custom',
  colorVar: 'var(--plan-custom)',
  ink: '#ffffff',
};

export interface PlannerCategoryDef {
  key: PlannerCategoryKey;
  label: string;
  hint: string;
  bucket: BucketKey;
  colorVar: string;
  budgetMap: Array<{ category: string; weight: number }>;
}

/**
 * Urutan kategori mengikuti slot palet yang sudah divalidasi (biru → oranye →
 * aqua → kuning → magenta → hijau) agar aman untuk buta warna pada bar bersegmen.
 */
export const PLANNER_CATEGORIES: PlannerCategoryDef[] = [
  {
    key: 'tetap',
    label: 'Pengeluaran Tetap',
    hint: 'Kos/KPR, listrik, air, internet, cicilan',
    bucket: 'needs',
    colorVar: 'var(--plan-c1)',
    budgetMap: [
      { category: 'housing', weight: 0.5 },
      { category: 'bills', weight: 0.5 },
    ],
  },
  {
    key: 'pokok',
    label: 'Kebutuhan Pokok & Harian',
    hint: 'Makan, belanja dapur, kesehatan',
    bucket: 'needs',
    colorVar: 'var(--plan-c2)',
    budgetMap: [
      { category: 'food', weight: 0.7 },
      { category: 'health', weight: 0.3 },
    ],
  },
  {
    key: 'harian',
    label: 'Operasional Harian',
    hint: 'Transport, bensin, parkir, ojek, tol',
    bucket: 'needs',
    colorVar: 'var(--plan-c3)',
    budgetMap: [{ category: 'transport', weight: 1 }],
  },
  {
    key: 'hiburan',
    label: 'Hiburan & Pribadi',
    hint: 'Jajan, nonton, hobi, langganan hiburan',
    bucket: 'wants',
    colorVar: 'var(--plan-c4)',
    budgetMap: [
      { category: 'shopping', weight: 0.6 },
      { category: 'other_expense', weight: 0.4 },
    ],
  },
  {
    key: 'tabungan',
    label: 'Tabungan & Dana Darurat',
    hint: 'Disisihkan dulu — target menabung, bukan batas belanja',
    bucket: 'savings',
    colorVar: 'var(--plan-c5)',
    budgetMap: [],
  },
  {
    key: 'investasi',
    label: 'Investasi',
    hint: 'Reksa dana, saham, emas, dana pensiun',
    bucket: 'savings',
    colorVar: 'var(--plan-c6)',
    budgetMap: [{ category: 'investment', weight: 1 }],
  },
];

/**
 * Satu baris alokasi — bisa kategori bawaan atau kategori kustom milik pengguna.
 * Helper di bawah bekerja atas array LineItem, sehingga kategori kustom otomatis
 * ikut terhitung di total, alokasi, budget, dan template.
 */
export interface LineItem {
  key: string;
  label: string;
  hint: string;
  group: GroupKey;
  /** CSS var (bawaan) atau hex (kustom). */
  color: string;
  budgetMap: Array<{ category: string; weight: number }>;
  isCustom: boolean;
}

export const FIXED_LINE_ITEMS: LineItem[] = PLANNER_CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  hint: c.hint,
  group: c.bucket,
  color: c.colorVar,
  budgetMap: c.budgetMap,
  isCustom: false,
}));

/** Ubah satu kategori kustom (pengeluaran) menjadi LineItem grup "custom". */
export const customToLineItem = (c: CustomCategoryRow): LineItem => ({
  key: c.id,
  label: c.emoji ? `${c.emoji} ${c.label}` : c.label,
  hint: 'Kategori kustom milikmu',
  group: 'custom',
  color: c.color || '#64748b',
  budgetMap: [{ category: c.id, weight: 1 }],
  isCustom: true,
});

export interface BudgetMethod {
  id: string;
  name: string;
  tagline: string;
  source: string;
  percentages: Record<PlannerCategoryKey, number>;
}

/**
 * Metode acuan dari riset keuangan. Persentase adalah titik awal yang bisa
 * disesuaikan. Pengeluaran tetap berada DI DALAM "Kebutuhan", bukan kategori di
 * luar 100%, agar tidak dihitung ganda. Kategori kustom mulai dari 0% (pengguna
 * mengalokasikannya dengan mengurangi kategori lain, lalu "Normalkan").
 */
export const METHODS: BudgetMethod[] = [
  {
    id: '50-30-20',
    name: '50 / 30 / 20',
    tagline: '50% kebutuhan · 30% keinginan · 20% tabungan. Titik awal yang direkomendasikan CFPB.',
    source: 'Consumer Financial Protection Bureau',
    percentages: { tetap: 25, pokok: 15, harian: 10, hiburan: 30, tabungan: 10, investasi: 10 },
  },
  {
    id: 'fidelity-50-15-5',
    name: 'Fidelity 50/15/5',
    tagline: '50% esensial · 15% investasi/pensiun · 5% dana darurat · sisanya fleksibel.',
    source: 'Fidelity',
    percentages: { tetap: 25, pokok: 15, harian: 10, hiburan: 30, tabungan: 5, investasi: 15 },
  },
  {
    id: 'pay-yourself-first',
    name: 'Pay Yourself First',
    tagline: 'Sisihkan tabungan & investasi lebih dulu (30%), sisanya untuk hidup.',
    source: 'Prinsip "bayar diri sendiri lebih dulu"',
    percentages: { tetap: 25, pokok: 15, harian: 10, hiburan: 20, tabungan: 15, investasi: 15 },
  },
];

export const DEFAULT_METHOD_ID = '50-30-20';

export const getMethod = (id: string): BudgetMethod =>
  METHODS.find((m) => m.id === id) ?? METHODS[0];

/** Jumlah seluruh persentase baris (idealnya 100). */
export const sumPercentages = (items: LineItem[], p: Percentages): number =>
  items.reduce((s, c) => s + (p[c.key] || 0), 0);

/** Total persentase satu grup (bucket atau "custom"). */
export const groupPercentage = (items: LineItem[], p: Percentages, group: GroupKey): number =>
  items.filter((c) => c.group === group).reduce((s, c) => s + (p[c.key] || 0), 0);

/** Nominal rupiah untuk satu persentase. */
export const amountFor = (income: number, pct: number): number => Math.round((income * pct) / 100);

/**
 * Skala ulang seluruh persentase secara proporsional agar berjumlah tepat 100.
 * Selisih pembulatan ditambahkan ke baris terbesar.
 */
export const normalizeTo100 = (items: LineItem[], p: Percentages): Percentages => {
  const total = sumPercentages(items, p);
  const next: Percentages = { ...p };
  if (total <= 0 || items.length === 0) return next;
  let running = 0;
  let largestKey = items[0].key;
  let largestVal = -1;
  for (const c of items) {
    const v = Math.round(((p[c.key] || 0) / total) * 100);
    next[c.key] = v;
    running += v;
    if ((p[c.key] || 0) > largestVal) {
      largestVal = p[c.key] || 0;
      largestKey = c.key;
    }
  }
  next[largestKey] += 100 - running;
  return next;
};

/**
 * Hitung target limit budget per kategori PENGELUARAN nyata dari alokasi gaji.
 * Baris tanpa `budgetMap` (Tabungan) tidak menghasilkan limit. Kategori kustom
 * memetakan ke dirinya sendiri.
 */
export const computeBudgetTargets = (
  items: LineItem[],
  income: number,
  p: Percentages
): Record<string, number> => {
  const targets: Record<string, number> = {};
  for (const item of items) {
    const amount = (income * (p[item.key] || 0)) / 100;
    for (const m of item.budgetMap) {
      targets[m.category] = (targets[m.category] || 0) + amount * m.weight;
    }
  }
  for (const k of Object.keys(targets)) targets[k] = Math.round(targets[k]);
  return targets;
};

/**
 * Terapkan target ke tabel `budgets` (upsert per kategori). Hanya kategori
 * dengan nominal > 0 yang ditulis. Mengembalikan jumlah kategori yang tersimpan.
 */
export const applyBudgetTargets = async (
  userId: string,
  targets: Record<string, number>
): Promise<number> => applyBudgets(userId, targets);

/**
 * Pengeluaran bulan ini yang teratribusi ke tiap baris alokasi (lewat budgetMap).
 * Tiap kategori pengeluaran hanya dipetakan ke satu baris, jadi tidak ada hitung ganda.
 */
export const spentByLineItem = (items: LineItem[], expenses: Transaction[]): Record<string, number> => {
  const byCat = sumExpensesByCategory(expenses);
  const result: Record<string, number> = {};
  for (const item of items) {
    let sum = 0;
    for (const m of item.budgetMap) sum += byCat[m.category] || 0;
    result[item.key] = sum;
  }
  return result;
};

export interface TemplateRow {
  title: string;
  amount: number;
  category: string;
  type: TransactionType;
}

/**
 * Baris template bulanan dari alokasi: pemasukan "Gaji" + tiap baris pengeluaran
 * yang teralokasi (Tabungan dilewati — itu sisa yang disisihkan, bukan pos belanja).
 */
export const computeTemplateRows = (items: LineItem[], income: number, p: Percentages): TemplateRow[] => {
  const rows: TemplateRow[] = [];
  if (income > 0) rows.push({ title: 'Gaji', amount: income, category: 'salary', type: 'income' });
  for (const item of items) {
    if (item.budgetMap.length === 0) continue; // Tabungan → bukan pos transaksi
    const amount = amountFor(income, p[item.key] || 0);
    if (amount <= 0) continue;
    rows.push({ title: item.label, amount, category: item.budgetMap[0].category, type: 'expense' });
  }
  return rows;
};

/** Simpan tiap baris sebagai pos template bulanan (idempoten, batch). Mengembalikan jumlah pos. */
export const applyPlanToTemplate = async (userId: string, rows: TemplateRow[]): Promise<number> =>
  applyMonthlyTemplateItems(userId, rows);

const STORAGE_KEY = 'salary-planner-v1';

export interface PlannerState {
  income: number;
  methodId: string;
  percentages: Percentages;
}

/** Muat state planner dari localStorage (per perangkat). `null` bila tidak ada/rusak. */
export const loadPlannerState = (): PlannerState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlannerState>;
    if (typeof parsed.income !== 'number' || !parsed.percentages) return null;
    // Minimal: semua kategori bawaan harus ada. Key kustom tambahan dibiarkan.
    const ok = FIXED_LINE_ITEMS.every((c) => typeof parsed.percentages?.[c.key] === 'number');
    if (!ok) return null;
    return {
      income: parsed.income,
      methodId: typeof parsed.methodId === 'string' ? parsed.methodId : DEFAULT_METHOD_ID,
      percentages: parsed.percentages as Percentages,
    };
  } catch {
    return null;
  }
};

/** Simpan state planner ke localStorage. */
export const savePlannerState = (state: PlannerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Penyimpanan bisa gagal (mode privat) — abaikan. */
  }
};
