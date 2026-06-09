import React from 'react';
import { Card } from '../ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatCurrency } from '../../utils/format';
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants';

export function Analytics({ transactions }) {
  if (!transactions || transactions.length === 0) return null;

  const expenses = transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
  const incomes = transactions.filter(t => t.type === TRANSACTION_TYPES.INCOME);

  // Process data for Donut Chart (Expenses by Category)
  const expensesByCategory = expenses.reduce((acc, t) => {
    const cat = t.category || 'other_expense';
    if (!acc[cat]) {
      const catData = CATEGORIES.expense.find(c => c.id === cat) || CATEGORIES.expense[CATEGORIES.expense.length - 1];
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
    { name: 'Bulan Ini', Pemasukan: totalIncome, Pengeluaran: totalExpense }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card p-3" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p className="font-semibold mb-1" style={{ color: payload[0].fill || payload[0].color || 'var(--color-primary)' }}>{payload[0].name || payload[0].dataKey}</p>
          <p className="text-secondary font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

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
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'var(--color-surface)', opacity: 0.4 }} 
                content={<CustomTooltip />}
                shared={false}
              />
              <Legend iconType="circle" />
              <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
