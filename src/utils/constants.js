import {
  Wallet,
  Briefcase,
  TrendingUp,
  Gift,
  Coffee,
  ShoppingCart,
  Car,
  Home,
  Zap,
  Heart,
  MoreHorizontal
} from 'lucide-react';

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const CATEGORIES = {
  income: [
    { id: 'salary', label: 'Gaji', icon: Briefcase, color: '#3b82f6' },
    { id: 'bonus', label: 'Bonus', icon: Gift, color: '#10b981' },
    { id: 'investment', label: 'Investasi', icon: TrendingUp, color: '#8b5cf6' },
    { id: 'other_income', label: 'Lainnya', icon: Wallet, color: '#64748b' },
  ],
  expense: [
    { id: 'food', label: 'Makanan', icon: Coffee, color: '#f59e0b' },
    { id: 'transport', label: 'Transportasi', icon: Car, color: '#06b6d4' },
    { id: 'shopping', label: 'Belanja', icon: ShoppingCart, color: '#ec4899' },
    { id: 'bills', label: 'Tagihan', icon: Zap, color: '#ef4444' },
    { id: 'health', label: 'Kesehatan', icon: Heart, color: '#14b8a6' },
    { id: 'housing', label: 'Tempat Tinggal', icon: Home, color: '#8b5cf6' },
    { id: 'other_expense', label: 'Lainnya', icon: MoreHorizontal, color: '#64748b' },
  ]
};
