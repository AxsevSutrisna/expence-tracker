import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/hooks/useTheme';
import {
  useTransactions,
  useTransactionSummary,
  useMonthComparison,
  TransactionForm,
  TransactionList,
  type TransactionFilters,
} from '@features/transactions';
import { Button, Card, Input, Select, Modal, Popover, PopoverContent, PopoverTrigger, Loading } from '@shared/ui';
import { LogOut, User, Download, Plus, X, Sun, Moon, Filter, CalendarRange, CalendarCheck, Target, Tags, Send, Wallet, MoreHorizontal, PiggyBank } from 'lucide-react';
import { formatCurrency, formatRupiahInput } from '@shared/utils/format';
import { getPreviousMonth, MONTH_OPTIONS, monthName } from '@shared/utils/date';
import { sumExpensesByCategory } from '@shared/utils/transactions';
import { TRANSACTION_TYPES, CATEGORIES as DEFAULT_CATEGORIES } from '@shared/config/constants';
import { useDebounce } from '@shared/hooks/useDebounce';
// Impor eager via path file (bukan barrel) agar barrel yang me-re-export komponen
// lazy (CategoryManager/BudgetManager/RecurringManager) tidak ikut menarik komponen
// berat itu ke chunk utama.
import { fetchCustomCategories } from '@features/categories/services/categoryService';
import { GamificationBadge, updateStreak } from '@features/gamification';
import { BudgetProgress } from '@features/budgets/components/BudgetProgress';
import { getBudgets } from '@features/budgets/services/budgetService';
import { processPendingRecurring } from '@features/recurring/services/recurringService';
import type { CategoryMap, Transaction, TransactionInput } from '@shared/types';

// Code-splitting: chart berat (Recharts) & komponen khusus-modal (emoji-picker di
// CategoryManager, ExcelJS lewat handleExport) dimuat on-demand agar tidak masuk
// bundle awal. Komponen modal diimpor via path-nya langsung supaya barrel yang juga
// mengekspor service (dipakai eager) tidak ikut menarik komponen ke chunk utama.
const Analytics = lazy(() => import('@features/analytics').then((m) => ({ default: m.Analytics })));
const MonthComparison = lazy(() =>
  import('@features/analytics/components/MonthComparison').then((m) => ({ default: m.MonthComparison }))
);
const CategoryManager = lazy(() =>
  import('@features/categories/components/CategoryManager').then((m) => ({ default: m.CategoryManager }))
);
const BudgetManager = lazy(() =>
  import('@features/budgets/components/BudgetManager').then((m) => ({ default: m.BudgetManager }))
);
const RecurringManager = lazy(() =>
  import('@features/recurring/components/RecurringManager').then((m) => ({ default: m.RecurringManager }))
);
const TemplateManager = lazy(() =>
  import('@features/recurring/components/TemplateManager').then((m) => ({ default: m.TemplateManager }))
);
const TelegramLinkModal = lazy(() =>
  import('@features/telegram/components/TelegramLinkModal').then((m) => ({ default: m.TelegramLinkModal }))
);

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refresh } = useTransactions(selectedMonth, selectedYear);
  const [filters, setFilters] = useState<TransactionFilters>({ keyword: '', minAmount: '', maxAmount: '' });
  const debouncedKeyword = useDebounce(filters.keyword, 300);

  const activeFilters: TransactionFilters = {
    ...filters,
    keyword: debouncedKeyword,
  };

  const { theme, toggleTheme } = useTheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { filteredTransactions, incomeTransactions, expenseTransactions, totalIncome, totalExpense, balance } = useTransactionSummary(transactions, activeFilters);
  const comparison = useMonthComparison(transactions, selectedMonth, selectedYear);

  const [categories, setCategories] = useState<CategoryMap>(DEFAULT_CATEGORIES);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);
  const [isRecurringManagerOpen, setIsRecurringManagerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [gamificationTrigger, setGamificationTrigger] = useState(0);
  const [budgetRefreshTrigger, setBudgetRefreshTrigger] = useState(0);

  const hasProcessedRecurring = useRef(false);
  const hasEvaluatedStreak = useRef(false);

  // Proses langganan jatuh tempo sekali saat mount; segarkan daftar bila ada yang dibuat.
  useEffect(() => {
    if (!user || hasProcessedRecurring.current) return;
    hasProcessedRecurring.current = true;
    processPendingRecurring(user.id)
      .then((count) => {
        if (count > 0) {
          console.log(`Processed ${count} recurring transactions.`);
          refresh();
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Evaluasi kepatuhan budget untuk streak "hari hemat", sekali setelah transaksi bulan ini termuat.
  // Memakai `transactions` dari hook, tanpa query tambahan.
  useEffect(() => {
    if (!user || loading || hasEvaluatedStreak.current) return;
    hasEvaluatedStreak.current = true;
    const userId = user.id;
    (async () => {
      try {
        const budgets = await getBudgets(userId);
        let stayedUnderBudget = true;
        if (budgets.length > 0) {
          const spent = sumExpensesByCategory(transactions);
          stayedUnderBudget = budgets.every((b) => (spent[b.category] || 0) <= b.amount_limit);
        }
        await updateStreak(userId, stayedUnderBudget);
        setGamificationTrigger((prev) => prev + 1);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [user, loading, transactions]);

  const loadCategories = async () => {
    if (!user) return;
    const customCats = await fetchCustomCategories(user.id);
    const merged: CategoryMap = {
      income: [...DEFAULT_CATEGORIES.income],
      expense: [...DEFAULT_CATEGORIES.expense],
    };
    customCats.forEach((c) => {
      merged[c.type].push({ ...c, isCustom: true });
    });
    setCategories(merged);
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddOrUpdate = async (data: TransactionInput) => {
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

  const handleToggleType = async (transaction: Transaction) => {
    const newType = transaction.type === TRANSACTION_TYPES.INCOME ? TRANSACTION_TYPES.EXPENSE : TRANSACTION_TYPES.INCOME;
    await updateTransaction(transaction.id, { type: newType });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const handleExport = async () => {
    // Dynamic import: ExcelJS (berat) hanya dimuat saat user benar-benar meng-export.
    const { exportToExcel } = await import('@shared/utils/exportUtils');
    await exportToExcel(filteredTransactions, selectedMonth, selectedYear, user?.user_metadata?.full_name, categories);
  };

  const months = MONTH_OPTIONS;

  const currentYr = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => ({ value: currentYr - i, label: (currentYr - i).toString() }));

  const currentMonthLabel = `${monthName(selectedMonth)} ${selectedYear}`;
  const { month: prevMonthNum, year: prevYearNum } = getPreviousMonth(selectedMonth, selectedYear);
  const prevMonthLabel = `${monthName(prevMonthNum)} ${prevYearNum}`;

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Card className="dashboard-header animate-in">
        {/* LEFT: Logo & Context */}
        <div className="header-left">
          <div className="header-brand">
            <img src="/expence-tracker.png" alt="Tracker Logo" className="header-logo" />
            <h1>Tracker<span className="text-blue">.io</span></h1>
          </div>
          <div className="header-badge-container">
            <span className="badge-month">
              {months.find((m) => m.value === selectedMonth)?.label.toUpperCase()} {selectedYear}
            </span>
            <GamificationBadge user={user} refreshTrigger={gamificationTrigger} />
          </div>
        </div>

        {/* RIGHT: Profile & Actions */}
        <div className="user-profile">
          <div className="profile-section">
            <div className="profile-text">
              <span className="profile-greeting">Welcome back</span>
              <strong className="profile-name" title={user.user_metadata?.full_name || user.email}>
                {user.user_metadata?.full_name || user.email}
              </strong>
            </div>
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User Avatar" className="avatar" />
            ) : (
              <div className="avatar"><User size={20} /></div>
            )}
          </div>

          <div className="header-divider"></div>

          <div className="user-actions">
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
          <div className="summary-header-row">
            <h2 id="summary-heading" className="font-black text-primary uppercase" style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
              Financial Summary
            </h2>
            <div className="summary-controls">
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
          <Suspense fallback={null}>
            <Analytics transactions={filteredTransactions} categories={categories} />
          </Suspense>
          <Suspense fallback={null}>
            <MonthComparison
              previousLabel={prevMonthLabel}
              currentLabel={currentMonthLabel}
              current={comparison.current}
              previous={comparison.previous}
              incomeChange={comparison.incomeChange}
              expenseChange={comparison.expenseChange}
            />
          </Suspense>
          <BudgetProgress transactions={filteredTransactions} categories={categories} user={user} refreshTrigger={budgetRefreshTrigger} />
        </section>

        <section>
          <Card className="flex flex-col lg:flex-row gap-4 w-full items-start lg:items-center justify-between" style={{ flexShrink: 0 }}>
            {/* Search Box */}
            <div className="w-full lg:flex-1" style={{ position: 'relative' }}>
              <input
                type="search"
                className="input-field w-full"
                placeholder="Cari transaksi..."
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                style={{ paddingRight: '2.5rem' }}
              />
              {filters.keyword && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, keyword: '' }))}
                  className="text-secondary cursor-pointer"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                  }}
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
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, minAmount: formatRupiahInput(e.target.value) }))
                        }
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label text-xs">Nominal Maksimum (Rp)</label>
                      <Input
                        type="text"
                        placeholder="Mis: Rp. 150.000"
                        value={filters.maxAmount}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, maxAmount: formatRupiahInput(e.target.value) }))
                        }
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

              <Button variant="outline" onClick={() => setIsBudgetManagerOpen(true)} className="flex items-center justify-center gap-2 px-4" title="Kelola Budget">
                <Target size={18} /> <span>Budget</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/planner')} className="flex items-center justify-center gap-2 px-4" title="Perencana Gaji">
                <Wallet size={18} /> <span>Perencana Gaji</span>
              </Button>

              <Button variant="outline" onClick={() => navigate('/savings')} className="flex items-center justify-center gap-2 px-4" title="Tabungan">
                <PiggyBank size={18} /> <span>Tabungan</span>
              </Button>

              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center gap-2 px-4" title="Menu lainnya">
                    <MoreHorizontal size={18} /> <span>Lainnya</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2">
                  <div className="toolbar-menu">
                    <button type="button" className="toolbar-menu-item" onClick={() => { setMoreOpen(false); setIsCategoryManagerOpen(true); }}>
                      <Tags size={18} /> <span>Kategori</span>
                    </button>
                    <button type="button" className="toolbar-menu-item" onClick={() => { setMoreOpen(false); setIsRecurringManagerOpen(true); }}>
                      <CalendarRange size={18} /> <span>Langganan</span>
                    </button>
                    <button type="button" className="toolbar-menu-item" onClick={() => { setMoreOpen(false); setIsTemplateManagerOpen(true); }}>
                      <CalendarCheck size={18} /> <span>Template</span>
                    </button>
                    <div className="toolbar-menu-sep" />
                    <button type="button" className="toolbar-menu-item" onClick={() => { setMoreOpen(false); setIsTelegramOpen(true); }}>
                      <Send size={18} /> <span>Telegram</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

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
              <Loading />
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
              <Loading />
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
        title={editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
        description={editingTransaction
          ? 'Ubah detail transaksi lalu simpan perubahannya.'
          : 'Catat pemasukan atau pengeluaran untuk periode yang kamu pilih.'}
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
        <Suspense fallback={null}>
          <CategoryManager
            isOpen={isCategoryManagerOpen}
            onClose={() => setIsCategoryManagerOpen(false)}
            user={user}
            currentCategories={categories}
            onCategoriesUpdated={loadCategories}
          />
        </Suspense>
      )}

      {isBudgetManagerOpen && (
        <Suspense fallback={null}>
          <BudgetManager
            isOpen={isBudgetManagerOpen}
            onClose={() => { setIsBudgetManagerOpen(false); setBudgetRefreshTrigger((x) => x + 1); }}
            user={user}
            categories={categories}
          />
        </Suspense>
      )}

      {isRecurringManagerOpen && (
        <Suspense fallback={null}>
          <RecurringManager
            isOpen={isRecurringManagerOpen}
            onClose={() => setIsRecurringManagerOpen(false)}
            user={user}
            categories={categories}
          />
        </Suspense>
      )}

      {isTemplateManagerOpen && (
        <Suspense fallback={null}>
          <TemplateManager
            isOpen={isTemplateManagerOpen}
            onClose={() => setIsTemplateManagerOpen(false)}
            user={user}
            categories={categories}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthLabel={`${months.find((m) => m.value === selectedMonth)?.label ?? ''} ${selectedYear}`}
            onApplied={refresh}
          />
        </Suspense>
      )}

      {isTelegramOpen && (
        <Suspense fallback={null}>
          <TelegramLinkModal isOpen={isTelegramOpen} onClose={() => setIsTelegramOpen(false)} />
        </Suspense>
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
