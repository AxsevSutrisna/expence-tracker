import { Card } from '@shared/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '@shared/utils/format';
import { findCategoryWithFallback } from '@shared/utils/categories';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { CategoryMap, Transaction } from '@shared/types';

export interface AnalyticsProps {
  transactions: Transaction[];
  categories: CategoryMap;
}

interface PieDatum {
  name: string;
  value: number;
  color?: string;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  dataKey?: string | number;
  fill?: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="card p-3" style={{ border: '3px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="font-bold mb-1" style={{ color: item.fill || item.color || 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          {item.name || item.dataKey}
        </p>
        <p className="text-secondary font-black text-lg m-0">{formatCurrency(item.value ?? 0)}</p>
      </div>
    );
  }
  return null;
}

export function Analytics({ transactions, categories }: AnalyticsProps) {
  if (!transactions || transactions.length === 0) return null;

  const expenses = transactions.filter((t) => t.type === TRANSACTION_TYPES.EXPENSE);
  const incomes = transactions.filter((t) => t.type === TRANSACTION_TYPES.INCOME);

  // Process data for Donut Chart (Expenses by Category)
  const expensesByCategory = expenses.reduce<Record<string, PieDatum>>((acc, t) => {
    const cat = t.category || 'other_expense';
    if (!acc[cat]) {
      const catData = findCategoryWithFallback(categories, TRANSACTION_TYPES.EXPENSE, cat)!;
      acc[cat] = { name: catData.label, value: 0, color: catData.color };
    }
    acc[cat].value += t.amount;
    return acc;
  }, {});

  const pieData = Object.values(expensesByCategory).sort((a, b) => b.value - a.value);

  // Process data for Bar Chart (Income vs Expense)
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const barData = [
    { name: 'Bulan Ini', Pemasukan: totalIncome, Pengeluaran: totalExpense },
  ];

  return (
    <div className="main-content-grid" style={{ marginBottom: '1.5rem' }}>
      <Card className="flex flex-col h-full min-h-[300px]">
        <h3 className="text-lg font-bold mb-4 text-primary">Pengeluaran per Kategori</h3>
        {pieData.length > 0 ? (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="var(--color-border)"
                  strokeWidth={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="square" wrapperStyle={{ fontWeight: 700, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-secondary">
            Belum ada pengeluaran.
          </div>
        )}
      </Card>

      <Card className="flex flex-col h-full min-h-[300px]">
        <h3 className="text-lg font-bold mb-4 text-primary">Arus Kas Bulanan</h3>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border)" strokeWidth={2} opacity={0.3} />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" tickLine={false} axisLine={{ stroke: 'var(--color-border)', strokeWidth: 3 }} tick={{ fontWeight: 700, fill: 'var(--color-text-primary)' }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--color-border)', opacity: 0.1 }}
                content={<CustomTooltip />}
                shared={false}
              />
              <Legend iconType="square" wrapperStyle={{ fontWeight: 700, paddingTop: '20px' }} />
              <Bar dataKey="Pemasukan" fill="var(--color-income-bg)" stroke="var(--color-border)" strokeWidth={3} radius={0} barSize={50} />
              <Bar dataKey="Pengeluaran" fill="var(--color-expense-bg)" stroke="var(--color-border)" strokeWidth={3} radius={0} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
