import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  RotateCcw,
  Check,
  Info,
  PiggyBank,
  Home,
  Utensils,
  Car,
  TrendingUp,
  Tag,
  Target,
  CalendarCheck,
} from 'lucide-react';
import { Button, Input, Modal } from '@shared/ui';
import { formatCurrency, formatRupiahInput, parseRupiah } from '@shared/utils/format';
import { getCategoryLabel } from '@shared/utils/categories';
import { CATEGORIES, TRANSACTION_TYPES } from '@shared/config/constants';
import type { CustomCategoryRow } from '@shared/types';
import { usePlannerData } from '../hooks/usePlannerData';
import {
  BUCKETS,
  CUSTOM_GROUP,
  FIXED_LINE_ITEMS,
  customToLineItem,
  METHODS,
  DEFAULT_METHOD_ID,
  getMethod,
  sumPercentages,
  groupPercentage,
  amountFor,
  normalizeTo100,
  computeBudgetTargets,
  applyBudgetTargets,
  spentByLineItem,
  computeTemplateRows,
  applyPlanToTemplate,
  loadPlannerState,
  savePlannerState,
  type Percentages,
  type PlannerCategoryKey,
  type LineItem,
  type GroupKey,
} from '../services/plannerService';
import './planner.css';

export interface SalaryPlannerProps {
  user: User;
}

const CAT_ICON: Record<PlannerCategoryKey, LucideIcon> = {
  tetap: Home,
  pokok: Utensils,
  harian: Car,
  hiburan: Sparkles,
  tabungan: PiggyBank,
  investasi: TrendingUp,
};

type Status = 'ok' | 'warn' | 'over';
const STATUS_FILL: Record<Status, string> = {
  ok: 'var(--plan-savings)',
  warn: '#b7791f',
  over: '#d03b3b',
};

export function SalaryPlanner({ user }: SalaryPlannerProps) {
  const saved = useMemo(() => loadPlannerState(), []);
  const { customExpenseCats, monthExpenses, monthLabel, loading: dataLoading } = usePlannerData(user.id);

  const [incomeInput, setIncomeInput] = useState(
    saved && saved.income > 0 ? formatRupiahInput(String(saved.income)) : ''
  );
  const income = parseRupiah(incomeInput);

  const [methodId, setMethodId] = useState<string>(saved?.methodId ?? DEFAULT_METHOD_ID);
  const [percentages, setPercentages] = useState<Percentages>(
    saved?.percentages ?? { ...getMethod(DEFAULT_METHOD_ID).percentages }
  );
  const [generated, setGenerated] = useState<boolean>(!!(saved && saved.income > 0));

  const [confirm, setConfirm] = useState<null | 'budget' | 'template'>(null);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  // Simpan otomatis ke localStorage setiap ada perubahan.
  useEffect(() => {
    savePlannerState({ income, methodId, percentages });
  }, [income, methodId, percentages]);

  // Semua baris alokasi = 6 kategori bawaan + kategori kustom pengguna.
  const lineItems = useMemo<LineItem[]>(
    () => [...FIXED_LINE_ITEMS, ...customExpenseCats.map(customToLineItem)],
    [customExpenseCats]
  );
  const hasCustom = customExpenseCats.length > 0;
  const displayGroups = useMemo(() => (hasCustom ? [...BUCKETS, CUSTOM_GROUP] : BUCKETS), [hasCustom]);

  const total = sumPercentages(lineItems, percentages);
  const isBalanced = Math.round(total) === 100;
  const canApply = income > 0 && isBalanced;
  const showResults = generated && income > 0;

  const targets = useMemo(
    () => computeBudgetTargets(lineItems, income, percentages),
    [lineItems, income, percentages]
  );
  const targetEntries = useMemo(
    () => Object.entries(targets).filter(([, amt]) => amt > 0).sort((a, b) => b[1] - a[1]),
    [targets]
  );
  const templateRows = useMemo(
    () => computeTemplateRows(lineItems, income, percentages),
    [lineItems, income, percentages]
  );
  const spentByKey = useMemo(() => spentByLineItem(lineItems, monthExpenses), [lineItems, monthExpenses]);

  const activeMethod = METHODS.find((m) => m.id === methodId);

  const labelForCategory = (catId: string): string => {
    const custom: CustomCategoryRow | undefined = customExpenseCats.find((c) => c.id === catId);
    if (custom) return custom.emoji ? `${custom.emoji} ${custom.label}` : custom.label;
    return getCategoryLabel(CATEGORIES, TRANSACTION_TYPES.EXPENSE, catId);
  };

  const iconFor = (item: LineItem): LucideIcon =>
    item.isCustom ? Tag : CAT_ICON[item.key as PlannerCategoryKey] ?? Tag;

  const selectMethod = (id: string) => {
    setMethodId(id);
    setPercentages((prev) => ({ ...prev, ...getMethod(id).percentages }));
    setApplyMsg(null);
  };

  const handleGenerate = () => {
    if (income <= 0) return;
    const id = methodId === 'custom' ? DEFAULT_METHOD_ID : methodId;
    setPercentages((prev) => ({ ...prev, ...getMethod(id).percentages }));
    setMethodId(id);
    setGenerated(true);
    setApplyMsg(null);
  };

  const changePct = (key: string, raw: number) => {
    const value = Number.isNaN(raw) ? 0 : raw;
    const v = Math.max(0, Math.min(100, Math.round(value)));
    setPercentages((prev) => ({ ...prev, [key]: v }));
    setMethodId('custom');
    setApplyMsg(null);
  };

  const handleNormalize = () => setPercentages((prev) => normalizeTo100(lineItems, prev));

  const resetToMethod = () => {
    const id = methodId === 'custom' ? DEFAULT_METHOD_ID : methodId;
    setPercentages((prev) => ({ ...prev, ...getMethod(id).percentages }));
    setMethodId(id);
    setApplyMsg(null);
  };

  const doApplyBudget = async () => {
    setApplying(true);
    try {
      const n = await applyBudgetTargets(user.id, targets);
      setApplyMsg(`Berhasil menyimpan ${n} limit budget dari alokasi gajimu. Cek progresnya di Dashboard.`);
      setConfirm(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Gagal menyimpan ke Budget.');
    } finally {
      setApplying(false);
    }
  };

  const doApplyTemplate = async () => {
    setApplying(true);
    try {
      const n = await applyPlanToTemplate(user.id, templateRows);
      setApplyMsg(`Berhasil menyimpan ${n} pos ke Template Bulanan. Tiap bulan baru akan dibuat otomatis.`);
      setConfirm(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Gagal menyimpan ke Template.');
    } finally {
      setApplying(false);
    }
  };

  const renderGroup = (groupKey: GroupKey) => {
    const cats = lineItems.filter((c) => c.group === groupKey);
    if (cats.length === 0) return null;
    const meta = displayGroups.find((g) => g.key === groupKey)!;
    const gPct = groupPercentage(lineItems, percentages, groupKey);
    return (
      <div key={groupKey} className="cat-group">
        <div className="cat-group-head">
          <span style={{ color: meta.colorVar }}>{meta.label}</span>
          <span className="cgh-figures">
            {gPct}% · {formatCurrency(amountFor(income, gPct))}
          </span>
        </div>

        {cats.map((item) => {
          const Icon = iconFor(item);
          const pct = percentages[item.key] || 0;
          const alloc = amountFor(income, pct);
          const spent = spentByKey[item.key] || 0;
          const used = alloc > 0 ? Math.round((spent / alloc) * 100) : 0;
          const status: Status = used > 100 ? 'over' : used >= 80 ? 'warn' : 'ok';
          const trackable = item.budgetMap.length > 0;
          return (
            <div className="cat-row" key={item.key}>
              <span className="cat-dot" style={{ background: item.color }} />
              <div className="cat-main">
                <div className="cat-label flex items-center gap-2">
                  <Icon size={15} /> {item.label}
                </div>
                <div className="cat-hint">{item.hint}</div>
                <div className="cat-chips">
                  {item.budgetMap.length === 0 ? (
                    <span className="budget-chip is-skip">Disisihkan (bukan limit)</span>
                  ) : (
                    item.budgetMap.map((m) => (
                      <span key={m.category} className="budget-chip">
                        → {labelForCategory(m.category)}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="cat-figures">
                <div className="cat-amount">{formatCurrency(alloc)}</div>
                <div className="cat-pct">{pct}%</div>
              </div>
              <div className="cat-slider-wrap">
                <input
                  className="cat-slider"
                  style={{ ['--slider-color']: item.color } as CSSProperties}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => changePct(item.key, Number(e.target.value))}
                  aria-label={`Persentase ${item.label}`}
                />
                <input
                  className="cat-num"
                  type="number"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => changePct(item.key, Number(e.target.value))}
                  aria-label={`Persentase ${item.label} dalam angka`}
                />
              </div>

              {!dataLoading && trackable && (
                <div className="cat-realization">
                  <div className="real-head">
                    <span>
                      Terpakai bulan ini: {formatCurrency(spent)}
                      {alloc > 0 ? ` / ${formatCurrency(alloc)}` : ' (belum dialokasikan)'}
                    </span>
                    {alloc > 0 && (
                      <span className={`real-pct real-${status}`}>
                        {used}%{used > 100 ? ' ⚠' : ''}
                      </span>
                    )}
                  </div>
                  {alloc > 0 && (
                    <div className="real-bar">
                      <div
                        className="real-fill"
                        style={{ width: `${Math.min(100, used)}%`, background: STATUS_FILL[status] }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      {/* 1. Metode + gaji */}
      <section className="flex flex-col gap-4" aria-labelledby="planner-h-method">
        <h2 id="planner-h-method" className="planner-step">
          <span className="step-num">1</span> Pilih metode & masukkan gaji
        </h2>

        <div className="method-grid" role="radiogroup" aria-label="Metode budgeting">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={methodId === m.id}
              onClick={() => selectMethod(m.id)}
              className={`method-card ${methodId === m.id ? 'is-selected' : ''}`}
            >
              <div className="method-card-top">
                <span className="method-name">{m.name}</span>
                {methodId === m.id && (
                  <span className="method-check">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <span className="method-tag">{m.tagline}</span>
              <div className="method-split" aria-hidden="true">
                {BUCKETS.map((b) => {
                  const pct = groupPercentage(FIXED_LINE_ITEMS, m.percentages, b.key);
                  if (pct <= 0) return null;
                  return (
                    <span
                      key={b.key}
                      className="method-split-seg"
                      style={{ width: `${pct}%`, background: b.colorVar }}
                    />
                  );
                })}
              </div>
              <span className="method-src">Sumber: {m.source}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3" style={{ maxWidth: '460px' }}>
          <Input
            label="Gaji / Pendapatan Bersih Bulanan"
            type="text"
            inputMode="numeric"
            placeholder="Misal: Rp. 5.000.000"
            hint="Nominal yang benar-benar kamu terima tiap bulan (take-home pay)."
            value={incomeInput}
            onChange={(e) => setIncomeInput(formatRupiahInput(e.target.value))}
          />
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={income <= 0}
            className="w-full flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Generate Budget
          </Button>
          {income <= 0 && (
            <p className="planner-note">
              <Info size={16} /> <span>Masukkan nominal gaji dulu untuk melihat rekomendasi alokasi.</span>
            </p>
          )}
        </div>
      </section>

      {showResults && (
        <>
          {/* 2. Ringkasan alokasi */}
          <section className="flex flex-col gap-4" aria-labelledby="planner-h-alloc">
            <h2 id="planner-h-alloc" className="planner-step">
              <span className="step-num">2</span> Rekomendasi alokasi {activeMethod ? `· ${activeMethod.name}` : '· Custom'}
            </h2>

            <div className={`total-meter ${isBalanced ? 'is-ok' : 'is-bad'}`}>
              <span>Total alokasi</span>
              <span className="total-badge">{total}%</span>
              {isBalanced ? (
                <span className="flex items-center gap-1" style={{ color: 'var(--plan-savings)' }}>
                  <Check size={18} /> Pas 100%
                </span>
              ) : (
                <Button variant="dark" onClick={handleNormalize} className="whitespace-nowrap">
                  Normalkan ke 100%
                </Button>
              )}
            </div>

            <div className="bucket-tiles">
              {displayGroups.map((g) => {
                const pct = groupPercentage(lineItems, percentages, g.key);
                return (
                  <div key={g.key} className="bucket-tile" style={{ borderLeftColor: g.colorVar }}>
                    <span className="bt-label">{g.label}</span>
                    <span className="bt-amount">{formatCurrency(amountFor(income, pct))}</span>
                    <span className="bt-pct" style={{ color: g.colorVar }}>
                      {pct}% · {g.short}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="alloc-bar"
              role="img"
              aria-label={`Alokasi: ${displayGroups
                .map((g) => `${g.label} ${groupPercentage(lineItems, percentages, g.key)} persen`)
                .join(', ')}`}
            >
              {displayGroups.map((g) => {
                const pct = groupPercentage(lineItems, percentages, g.key);
                if (pct <= 0) return null;
                return (
                  <div
                    key={g.key}
                    className="alloc-seg"
                    style={{ width: `${pct}%`, background: g.colorVar, color: g.ink }}
                  >
                    {pct >= 10 ? `${g.label} ${pct}%` : `${pct}%`}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Rincian per kategori + realisasi */}
          <section className="flex flex-col gap-4" aria-labelledby="planner-h-detail">
            <h2 id="planner-h-detail" className="planner-step">
              <span className="step-num">3</span> Sesuaikan & bandingkan realisasi
            </h2>
            <div className="real-summary">
              <Info size={15} />
              <span>
                Bar hijau/kuning/merah di tiap kategori = pengeluaran tercatat <b>{monthLabel}</b> dibanding
                alokasinya.
              </span>
            </div>

            {displayGroups.map((g) => renderGroup(g.key))}

            <p className="planner-note">
              <Info size={16} />
              <span>
                <b>Tabungan &amp; Dana Darurat</b> tidak dibuat sebagai limit/realisasi — itu target yang kamu
                sisihkan, bukan batas belanja.
              </span>
            </p>
          </section>

          {/* 4. Aksi */}
          <section className="flex flex-col gap-3">
            <div className="planner-actions">
              <Button
                variant="primary"
                disabled={!canApply}
                onClick={() => setConfirm('budget')}
                className="flex items-center justify-center gap-2"
              >
                <Target size={18} /> Terapkan ke Budget
              </Button>
              <Button
                variant="dark"
                disabled={!canApply}
                onClick={() => setConfirm('template')}
                className="flex items-center justify-center gap-2"
              >
                <CalendarCheck size={18} /> Terapkan ke Template Bulanan
              </Button>
              <Button
                variant="outline"
                onClick={resetToMethod}
                className="flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Reset ke {activeMethod ? activeMethod.name : 'metode default'}
              </Button>
            </div>
            {!isBalanced && (
              <p className="planner-note">
                <Info size={16} /> <span>Total alokasi harus pas 100% sebelum bisa diterapkan.</span>
              </p>
            )}
            {applyMsg && (
              <p className="planner-note" style={{ color: 'var(--plan-savings)', fontWeight: 700 }}>
                <Check size={16} /> <span>{applyMsg}</span>
              </p>
            )}
          </section>
        </>
      )}

      {/* Konfirmasi (Budget / Template) */}
      <Modal
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'template' ? 'Terapkan ke Template Bulanan?' : 'Terapkan ke Budget?'}
        description={
          confirm === 'template'
            ? 'Pemasukan & pengeluaran rutin dibuat/diperbarui sebagai template; tiap bulan baru akan dibuat otomatis.'
            : 'Limit anggaran per kategori pengeluaran akan dibuat / diperbarui dari alokasi gajimu.'
        }
      >
        {confirm === 'budget' && (
          <>
            <div className="apply-preview">
              {targetEntries.map(([cat, amt]) => (
                <div className="apply-row" key={cat}>
                  <span>{labelForCategory(cat)}</span>
                  <span className="ar-amount">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
            <p className="planner-note">
              <Info size={16} />
              <span>
                Tabungan &amp; Dana Darurat ({formatCurrency(amountFor(income, percentages.tabungan || 0))})
                disisihkan sendiri dan tidak dibuat sebagai limit.
              </span>
            </p>
          </>
        )}

        {confirm === 'template' && (
          <>
            <div className="apply-preview">
              {templateRows.map((r) => (
                <div className="apply-row" key={`${r.type}-${r.title}`}>
                  <span>
                    {r.title}{' '}
                    <small className="text-secondary">
                      · {r.type === 'income' ? 'Pemasukan' : labelForCategory(r.category)}
                    </small>
                  </span>
                  <span
                    className="ar-amount"
                    style={{ color: r.type === 'income' ? 'var(--color-text-income)' : 'var(--color-text-expense)' }}
                  >
                    {formatCurrency(r.amount)}
                  </span>
                </div>
              ))}
            </div>
            <p className="planner-note">
              <Info size={16} />
              <span>
                Pos dengan nama sama diperbarui, bukan diduplikasi. Tabungan tidak dibuat sebagai pos (jadi
                sisa/surplus template = dana yang kamu sisihkan).
              </span>
            </p>
          </>
        )}

        <div className="planner-actions" style={{ marginTop: '1rem' }}>
          <Button
            variant="primary"
            onClick={confirm === 'template' ? doApplyTemplate : doApplyBudget}
            disabled={applying}
          >
            {applying ? 'Menyimpan...' : 'Ya, Terapkan'}
          </Button>
          <Button variant="outline" onClick={() => setConfirm(null)} disabled={applying}>
            Batal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
