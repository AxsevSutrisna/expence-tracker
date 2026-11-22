import { Card } from '@shared/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '@shared/utils/format';

interface CmpTooltipItem {
  name?: string;
  value?: number;
}

interface CmpTooltipProps {
  active?: boolean;
  payload?: CmpTooltipItem[];
  label?: string;
}

/** Tooltip "shared": menampilkan nama bulan + Pemasukan & Pengeluaran sekaligus. */
function ComparisonTooltip({ active, payload, label }: CmpTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="card p-3" style={{ border: '3px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="font-bold" style={{ margin: '0 0 0.25rem', textTransform: 'uppercase' }}>{label}</p>
      {payload.map((it) => (
        <p
          key={it.name}
          className="font-black"
          style={{ margin: 0, color: it.name === 'Pengeluaran' ? 'var(--color-text-expense)' : 'var(--color-text-income)' }}
        >
          {it.name}: {formatCurrency(it.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export interface MonthComparisonProps {
  previousLabel: string;
  currentLabel: string;
  current: { income: number; expense: number };
  previous: { income: number; expense: number };
  /** Persentase perubahan vs bulan lalu; null = tak ada basis (bulan lalu 0). */
  incomeChange: number | null;
  expenseChange: number | null;
}

interface ChangeBadgeProps {
  change: number | null;
  currentValue: number;
  /** true untuk pemasukan (naik = baik); false untuk pengeluaran (naik = buruk). */
  goodWhenUp: boolean;
}

function ChangeBadge({ change, currentValue, goodWhenUp }: ChangeBadgeProps) {
  if (change === null) {
    return (
      <span className="cmp-badge cmp-badge-neutral">
        <Minus size={14} />
        {currentValue > 0 ? 'Baru' : '—'}
      </span>
    );
  }

  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="cmp-badge cmp-badge-neutral">
        <Minus size={14} />
        0%
      </span>
    );
  }

  const up = rounded > 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`cmp-badge cmp-badge-${good ? 'good' : 'bad'}`}>
      <Icon size={14} />
      {Math.abs(rounded)}%
    </span>
  );
}

export function MonthComparison({
  previousLabel,
  currentLabel,
  current,
  previous,
  incomeChange,
  expenseChange,
}: MonthComparisonProps) {
  const hasData =
    current.income > 0 || current.expense > 0 || previous.income > 0 || previous.expense > 0;
  if (!hasData) return null;

  const chartData = [
    { name: previousLabel, Pemasukan: previous.income, Pengeluaran: previous.expense },
    { name: currentLabel, Pemasukan: current.income, Pengeluaran: current.expense },
  ];

  return (
    <Card className="flex flex-col gap-4 w-full mt-6">
      <div>
        <h3 className="text-lg font-bold text-primary">Perbandingan Bulanan</h3>
        <p className="input-hint">{previousLabel} vs {currentLabel}</p>
      </div>

      {/* Ringkasan perubahan + persentase */}
      <div className="cmp-rows">
        <div className="cmp-row">
          <span className="font-bold">Pemasukan</span>
          <div className="cmp-row-values">
            <span className="text-secondary">{formatCurrency(previous.income)}</span>
            <ArrowRightMini />
            <span className="text-income font-black">{formatCurrency(current.income)}</span>
            <ChangeBadge change={incomeChange} currentValue={current.income} goodWhenUp />
          </div>
        </div>
        <div className="cmp-row">
          <span className="font-bold">Pengeluaran</span>
          <div className="cmp-row-values">
            <span className="text-secondary">{formatCurrency(previous.expense)}</span>
            <ArrowRightMini />
            <span className="text-expense font-black">{formatCurrency(current.expense)}</span>
            <ChangeBadge change={expenseChange} currentValue={current.expense} goodWhenUp={false} />
          </div>
        </div>
      </div>

      {/* Grafik batang berkelompok: bulan lalu vs bulan ini */}
      <div style={{ height: '280px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" strokeWidth={2} opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="var(--color-text-secondary)"
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)', strokeWidth: 3 }}
              tick={{ fontWeight: 700, fill: 'var(--color-text-primary)' }}
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: 'var(--color-border)', opacity: 0.1 }} content={<ComparisonTooltip />} />
            <Legend iconType="square" wrapperStyle={{ fontWeight: 700, paddingTop: '12px' }} />
            <Bar dataKey="Pemasukan" fill="var(--color-income-bg)" stroke="var(--color-border)" strokeWidth={3} radius={0} />
            <Bar dataKey="Pengeluaran" fill="var(--color-expense-bg)" stroke="var(--color-border)" strokeWidth={3} radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/** Panah kecil "→" penghubung nilai bulan lalu ke bulan ini. */
function ArrowRightMini() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
