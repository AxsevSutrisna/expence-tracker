import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBudgets } from '../services/budgetService';
import { Progress, Card } from '@shared/ui';
import { getCategoryLabel } from '@shared/utils/categories';
import { TRANSACTION_TYPES } from '@shared/config/constants';
import type { Budget, CategoryMap, Transaction } from '@shared/types';

export interface BudgetProgressProps {
  transactions: Transaction[];
  categories: CategoryMap;
  user: User;
  /** Dinaikkan dari parent untuk memaksa muat ulang budget (mis. setelah manajer budget ditutup). */
  refreshTrigger?: number;
}

export function BudgetProgress({ transactions, categories, user, refreshTrigger }: BudgetProgressProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Budget hanya berubah lewat BudgetManager, bukan karena transaksi berubah.
  // Jadi muat sekali (dan saat refreshTrigger naik), bukan tiap transaksi/ filter berubah.
  useEffect(() => {
    if (user) {
      getBudgets(user.id).then((data) => setBudgets(data)).catch(console.error);
    }
  }, [user, refreshTrigger]);

  if (!budgets || budgets.length === 0) return null;

  // Calculate spent amount per budgeted category for the current month
  // Assuming transactions passed in are already filtered for the current month by Dashboard
  const categorySpent: Record<string, number> = {};
  transactions.forEach((t) => {
    if (t.type === 'expense' && t.category) {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    }
  });

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}Rb`;
    return `Rp ${amount}`;
  };

  return (
    <Card className="flex flex-col gap-6 w-full mt-6">
      <h3 className="font-black text-xl md:text-2xl uppercase border-b-4 border-border pb-2 inline-block self-start" style={{ margin: 0 }}>
        Status Budget
      </h3>

      <div className="flex flex-col gap-6 mt-2">
        {budgets.map((b) => {
          const spent = categorySpent[b.category] || 0;
          const limit = b.amount_limit;
          const rawPercentage = (spent / limit) * 100;
          const percentage = Math.min(rawPercentage, 100);
          const isOverBudget = spent > limit;

          let barColor = '#4ade80'; // Neo green
          if (percentage >= 80) barColor = '#fb7185'; // Neo red
          else if (percentage >= 50) barColor = '#facc15'; // Neo yellow

          return (
            <div
              key={b.id}
              className="flex flex-col gap-4"
              style={{
                padding: '1rem',
                border: '4px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                boxShadow: '4px 4px 0px var(--color-border)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                    {getCategoryLabel(categories, TRANSACTION_TYPES.EXPENSE, b.category)}
                  </span>
                  {isOverBudget && (
                    <div
                      className="text-xs font-black px-2 py-1 flex items-center gap-1"
                      style={{
                        backgroundColor: '#fb7185',
                        color: '#000',
                        border: '1px solid #000',
                        boxShadow: '3px 3px 0px #000',
                        transform: 'rotate(-3deg)',
                        marginLeft: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🚨 OVER BUDGET
                    </div>
                  )}
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-black text-xl" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(spent)}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}> / {formatCurrency(limit)}</span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <Progress value={percentage} indicatorColor={barColor} />
                <div
                  style={{
                    position: 'absolute',
                    top: 0, bottom: 0, left: 0, right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <span className="font-black text-sm" style={{ color: '#000', textShadow: '0px 0px 2px rgba(255,255,255,0.8)' }}>
                    {rawPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
