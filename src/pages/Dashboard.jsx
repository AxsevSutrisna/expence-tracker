import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { TransactionForm } from '../components/tracker/TransactionForm';
import { TransactionList } from '../components/tracker/TransactionList';
import { Analytics } from '../components/tracker/Analytics';
import { Button, Card, Input, Select, Modal, Popover, PopoverContent, PopoverTrigger } from '../components/ui';
import { LogOut, User, Download, Plus, X, Sun, Moon, Filter, CalendarRange, Target, Tags } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TRANSACTION_TYPES, CATEGORIES as DEFAULT_CATEGORIES } from '../utils/constants';
import { exportToExcel } from '../utils/exportUtils';
import { useDebounce } from '../hooks/useDebounce';
import { fetchCustomCategories } from '../lib/categoryService';
import { CategoryManager } from '../components/tracker/CategoryManager';
import { GamificationBadge } from '../components/tracker/GamificationBadge';
import { BudgetManager } from '../components/tracker/BudgetManager';
import { BudgetProgress } from '../components/tracker/BudgetProgress';
import { RecurringManager } from '../components/tracker/RecurringManager';
import { processPendingRecurring } from '../lib/recurringService';
import { updateStreak } from '../lib/gamificationService';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(selectedMonth, selectedYear);
  const [filters, setFilters] = useState({ keyword: '', minAmount: '', maxAmount: '' });
  const debouncedKeyword = useDebounce(filters.keyword, 300);

  const activeFilters = {
    ...filters,
    keyword: debouncedKeyword
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { filteredTransactions, incomeTransactions, expenseTransactions, totalIncome, totalExpense, balance } = useTransactionSummary(transactions, activeFilters);


  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);
  const [isRecurringManagerOpen, setIsRecurringManagerOpen] = useState(false);
  const [gamificationTrigger, setGamificationTrigger] = useState(0);

  // Background task: evaluate recurring & update streak on mount
  useEffect(() => {
    if (user) {
      processPendingRecurring(user.id).then(count => {
        if (count > 0) {
          console.log(`Processed ${count} recurring transactions.`);
          // If we had a way to trigger a full refresh of useTransactions here, we would.
          // But since it relies on month/year, the next page reload or manual add will show them.
        }
      }).catch(console.error);

      // Simple gamification logic: Increment streak if they open the app today 
      // (assuming they haven't overspent yet. A more robust way evaluates totalExpense vs budget).
      // We pass true for now.
      updateStreak(user.id, true).then(() => {
        setGamificationTrigger(prev => prev + 1);
      }).catch(console.error);
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    const customCats = await fetchCustomCategories(user.id);
    const merged = {
      income: [...DEFAULT_CATEGORIES.income],
      expense: [...DEFAULT_CATEGORIES.expense]
    };
    customCats.forEach(c => {
      merged[c.type].push({ ...c, isCustom: true });
    });
    setCategories(merged);
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  const handleAddOrUpdate = async (data) => {
    setIsSubmitting(true);
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    } else {
      await addTransaction(data);
    }
    setIsSubmitting(false);
    setIsModalOpen(false); // Close modal on success
  };

  const handleToggleType = async (transaction) => {
    const newType = transaction.type === TRANSACTION_TYPES.INCOME ? TRANSACTION_TYPES.EXPENSE : TRANSACTION_TYPES.INCOME;
    await updateTransaction(transaction.id, { type: newType });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleExport = () => {
    exportToExcel(filteredTransactions, selectedMonth, selectedYear, user?.user_metadata?.full_name, categories);
  };

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const currentYr = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({ value: currentYr - i, label: (currentYr - i).toString() }));

  return (
    <div className="dashboard-container">
      <Card className="dashboard-header animate-in">
        {/* LEFT: Logo & Context */}
        <div className="header-left flex-col sm:flex-row flex gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <img src="/expence-tracker.png" alt="Tracker Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 style={{ margin: 0 }}>Tracker<span className="text-blue">.io</span></h1>
          </div>
          <div className="header-badge-container flex gap-2 items-center flex-wrap">
            <span className="badge-month">
              {months.find(m => m.value === selectedMonth)?.label.toUpperCase()} {selectedYear}
            </span>
            <GamificationBadge user={user} refreshTrigger={gamificationTrigger} />
          </div>
        </div>

        {/* RIGHT: Profile & Actions */}
        <div className="user-profile">
          <div className="profile-section">
            <div className="profile-text">
              <span className="profile-greeting">Welcome back</span>
              <strong className="profile-name" title={user?.user_metadata?.full_name || user?.email}>
                {user?.user_metadata?.full_name || user?.email}
              </strong>
            </div>
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User Avatar" className="avatar" />
            ) : (
              <div className="avatar"><User size={20} /></div>
            )}
          </div>

          <div className="header-divider"></div>

          <div className="user-actions flex items-center gap-2">
            <Button variant="outline" onClick={toggleTheme} className="btn-icon" title="Toggle Theme" style={{ color: 'var(--color-text-primary)' }}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>
            <Button variant="outline" onClick={signOut} className="btn-icon" title="Logout" style={{ color: 'var(--color-text-primary)' }}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </Card>

      <main className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animationDelay: '0.1s' }}>
        <section aria-labelledby="summary-heading">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 id="summary-heading" className="font-black text-primary uppercase" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
              Financial Summary
            </h2>
            <div className="flex items-center" style={{ gap: '16px' }}>
              <Select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={months}
                style={{ minWidth: '120px', margin: 0 }}
              />
              <Select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={years}
                style={{ minWidth: '100px', margin: 0 }}
              />
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-card balance">
              <h3>SALDO SAAT INI</h3>
              <p>{formatCurrency(balance)}</p>
            </div>
            <div className="summary-card income">
              <h3>PEMASUKAN</h3>
              <p>{formatCurrency(totalIncome)}</p>
            </div>
            <div className="summary-card expense">
              <h3>PENGELUARAN</h3>
              <p>{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section aria-labelledby="analytics-heading">
          <Analytics transactions={filteredTransactions} categories={categories} />
          <BudgetProgress transactions={filteredTransactions} categories={categories} user={user} />
        </section>

        <section>
          <Card className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between" style={{ flexShrink: 0 }}>
            {/* Search Box */}
            <div className="w-full lg:flex-1 relative">
              <input
                type="search"
                className="input-field w-full"
                placeholder="Cari transaksi..."
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                style={{ paddingRight: '2.5rem' }}
              />
              {filters.keyword && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, keyword: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer"
                  style={{ padding: '0.25rem', background: 'transparent', border: 'none' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="dashboard-actions">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <Filter size={18} />
                    <span>Filter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-4">
                  <div className="flex flex-col gap-4">
                    <h4 className="font-bold border-b-2 border-border pb-2 mb-2">Filter Lanjutan</h4>
                    
                    <div className="input-group">
                      <label className="input-label text-xs">Nominal Minimum (Rp)</label>
                      <Input
                        type="text"
                        placeholder="Mis: Rp. 50.000"
                        value={filters.minAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFilters(prev => ({ 
                            ...prev, 
                            minAmount: val ? `Rp. ${parseInt(val, 10).toLocaleString('id-ID')}` : '' 
                          }));
                        }}
                      />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label text-xs">Nominal Maksimum (Rp)</label>
                      <Input
                        type="text"
                        placeholder="Mis: Rp. 150.000"
                        value={filters.maxAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFilters(prev => ({ 
                            ...prev, 
                            maxAmount: val ? `Rp. ${parseInt(val, 10).toLocaleString('id-ID')}` : '' 
                          }));
                        }}
                      />
                    </div>

                    <Button 
                      variant="dark" 
                      className="mt-2 w-full"
                      onClick={() => setFilters({ keyword: '', minAmount: '', maxAmount: '' })}
                    >
                      Reset Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" onClick={() => setIsCategoryManagerOpen(true)} className="whitespace-nowrap px-4" title="Kelola Kategori">
                <Tags size={16} className="inline mr-1" /> Kategori
              </Button>
              
              <Button variant="outline" onClick={() => setIsBudgetManagerOpen(true)} className="whitespace-nowrap px-4" title="Kelola Budget">
                <Target size={16} className="inline mr-1" /> Budget
              </Button>
              
              <Button variant="outline" onClick={() => setIsRecurringManagerOpen(true)} className="whitespace-nowrap px-4" title="Kelola Langganan">
                <CalendarRange size={16} className="inline mr-1" /> Langganan
              </Button>
              
              <Button variant="primary" onClick={handleExport} className="btn-export flex items-center justify-center gap-2 whitespace-nowrap px-6">
                <Download size={18} />
                Export
              </Button>
            </div>
          </Card>
        </section>

        <section className="main-content-grid">
          <Card>
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : (
              <TransactionList
                title="Arus Pemasukan"
                type={TRANSACTION_TYPES.INCOME}
                transactions={incomeTransactions}
                onDelete={deleteTransaction}
                onEdit={handleEdit}
                onToggleType={handleToggleType}
                categories={categories}
              />
            )}
          </Card>
          <Card>
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : (
              <TransactionList
                title="Arus Pengeluaran"
                type={TRANSACTION_TYPES.EXPENSE}
                transactions={expenseTransactions}
                onDelete={deleteTransaction}
                onEdit={handleEdit}
                onToggleType={handleToggleType}
                categories={categories}
              />
            )}
          </Card>
        </section>
      </main>

      <footer className="text-center my-8 text-secondary text-sm">
        <p>&#169; {new Date().getFullYear()} Tracker.io. Expence Tracker Project</p>
      </footer>

      {/* Modal is moved here to avoid CSS transform context from .animate-in */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        title={editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}
      >
        <TransactionForm
          onSubmit={handleAddOrUpdate}
          loading={isSubmitting}
          editingTransaction={editingTransaction}
          onCancelEdit={handleCancelEdit}
          categories={categories}
        />
      </Modal>

      {isCategoryManagerOpen && (
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          user={user}
          currentCategories={categories}
          onCategoriesUpdated={loadCategories}
        />
      )}

      {isBudgetManagerOpen && (
        <BudgetManager
          isOpen={isBudgetManagerOpen}
          onClose={() => setIsBudgetManagerOpen(false)}
          user={user}
          categories={categories}
        />
      )}

      {isRecurringManagerOpen && (
        <RecurringManager
          isOpen={isRecurringManagerOpen}
          onClose={() => setIsRecurringManagerOpen(false)}
          user={user}
          categories={categories}
        />
      )}

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
        aria-label="Tambah Transaksi"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
