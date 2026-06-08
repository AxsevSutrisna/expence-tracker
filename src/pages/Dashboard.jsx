import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useTransactionSummary } from '../hooks/useTransactionSummary';
import { TransactionForm } from '../components/tracker/TransactionForm';
import { TransactionList } from '../components/tracker/TransactionList';
import { Button, Card, Input, Select } from '../components/ui';
import { LogOut, User, Download } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { TRANSACTION_TYPES } from '../utils/constants';
import { exportToExcel } from '../utils/exportUtils';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(selectedMonth, selectedYear);
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const {
    filteredTransactions,
    incomeTransactions,
    expenseTransactions,
    totalIncome,
    totalExpense,
    balance
  } = useTransactionSummary(transactions, searchQuery);

  const handleAddOrUpdate = async (data) => {
    setIsSubmitting(true);
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    } else {
      await addTransaction(data);
    }
    setIsSubmitting(false);
  };

  const handleToggleType = async (transaction) => {
    const newType = transaction.type === TRANSACTION_TYPES.INCOME ? TRANSACTION_TYPES.EXPENSE : TRANSACTION_TYPES.INCOME;
    await updateTransaction(transaction.id, { type: newType });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
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

      <main className="animate-in flex-col gap-6" style={{ animationDelay: '0.1s' }}>
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

        <section>
          <TransactionForm 
            onSubmit={handleAddOrUpdate} 
            loading={isSubmitting} 
            editingTransaction={editingTransaction} 
            onCancelEdit={handleCancelEdit} 
          />
        </section>

        <section>
          <Card className="search-card flex items-center gap-3 flex-wrap">
            <input
              type="search"
              placeholder="Cari transaksi berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field flex-1"
              style={{ minWidth: '200px' }}
            />
            <Button variant="dark" style={{ padding: '0.75rem 2rem' }}>Cari</Button>
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
    </div>
  );
}
