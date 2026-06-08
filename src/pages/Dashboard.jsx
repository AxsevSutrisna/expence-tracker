import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { TransactionForm } from '../components/tracker/TransactionForm';
import { TransactionList } from '../components/tracker/TransactionList';
import { Analytics } from '../components/tracker/Analytics';
import { Button, Card, Input, Select, Modal } from '../components/ui';
import { LogOut, User, Download, Plus, X, Sun, Moon } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TRANSACTION_TYPES } from '../utils/constants';
import { exportToExcel } from '../utils/exportUtils';
import { useDebounce } from '../hooks/useDebounce';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(selectedMonth, selectedYear);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  const {
    filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    balance
  } = useTransactionSummary(transactions, debouncedSearchQuery);

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
    exportToExcel(filteredTransactions, selectedMonth, selectedYear);
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
        <div className="flex items-center gap-2">
          <img src="/expence-tracker.png" alt="Tracker Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0 }}>Tracker<span className="text-blue">.io</span></h1>
        </div>
        <div className="user-profile">
          <div className="flex-col items-end text-right">
            <span className="text-sm text-secondary">
              Halo, <strong className="text-primary">{user?.user_metadata?.full_name || user?.email}</strong>
            </span>
            <span className="badge-month">
              {months.find(m => m.value === selectedMonth)?.label.toUpperCase()} {selectedYear}
            </span>
          </div>
          <Button variant="outline" onClick={toggleTheme} className="btn-icon" title="Toggle Theme" style={{ border: 'none', color: 'var(--color-text-secondary)' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="User Avatar" className="avatar" />
          ) : (
            <div className="avatar"><User size={20} /></div>
          )}
          <Button variant="outline" onClick={signOut} className="btn-icon" title="Logout" style={{ marginLeft: '0.5rem', border: 'none', color: 'var(--color-text-secondary)' }}>
            <LogOut size={20} />
          </Button>
        </div>
      </Card>

      <main className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animationDelay: '0.1s' }}>
        <section aria-labelledby="summary-heading">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 id="summary-heading" className="text-xl font-bold text-primary" style={{ margin: 0 }}>Financial Summary</h2>
            <div className="flex items-center gap-2">
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
          <Analytics transactions={filteredTransactions} />
        </section>

        <section>
          <Card className="search-card flex items-center gap-3 flex-wrap">
            <div className="relative flex-1" style={{ minWidth: '200px' }}>
              <input
                type="search"
                placeholder="Cari transaksi berdasarkan judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full"
                style={{ paddingRight: '2.5rem' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary cursor-pointer"
                  style={{ padding: '0.25rem', background: 'transparent', border: 'none' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2" style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
              <Download size={18} />
              Export
            </Button>
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
              />
            )}
          </Card>
        </section>
      </main>

      <footer className="text-center my-8 text-secondary text-sm">
        <p>&#169; {new Date().getFullYear()} Tracker.io. React + Supabase Personal Project.</p>
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
        />
      </Modal>

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
