import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionForm } from '../components/tracker/TransactionForm';
import { TransactionList } from '../components/tracker/TransactionList';
import { Button, Card, Input } from '../components/ui';
import { LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

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
    const newType = transaction.type === 'income' ? 'expense' : 'income';
    await updateTransaction(transaction.id, { type: newType });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    // Scroll to top where the form is (optional but helpful)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <Card className="dashboard-header animate-in">
        <h1>Tracker<span style={{ color: '#3b82f6' }}>.io</span></h1>
        <div className="user-profile">
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Halo, <strong style={{ color: 'var(--color-text-primary)' }}>{user?.user_metadata?.full_name || user?.email}</strong>
            </span>
            <span style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#eef2ff', padding: '2px 10px', borderRadius: '12px', marginTop: '4px' }}>
              BULAN INI
            </span>
          </div>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="User Avatar" className="avatar" />
          ) : (
            <div className="avatar" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}><User size={20} /></div>
          )}
          <Button variant="outline" onClick={signOut} className="btn-icon" title="Logout" style={{ marginLeft: '0.5rem', border: 'none', color: 'var(--color-text-secondary)' }}>
            <LogOut size={20} />
          </Button>
        </div>
      </Card>

      <main className="animate-in" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="visually-hidden">Financial Summary</h2>
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
          <Card className="search-card">
            <input
              type="search"
              placeholder="Cari transaksi berdasarkan judul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ flex: 1 }}
            />
            <Button variant="dark" style={{ padding: '0.75rem 2rem' }}>Cari</Button>
          </Card>
        </section>

        <section className="main-content-grid">
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading...</div>
            ) : (
              <TransactionList
                title="Arus Pemasukan"
                type="income"
                transactions={incomeTransactions}
                onDelete={deleteTransaction}
                onEdit={handleEdit}
                onToggleType={handleToggleType}
              />
            )}
          </Card>
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading...</div>
            ) : (
              <TransactionList
                title="Arus Pengeluaran"
                type="expense"
                transactions={expenseTransactions}
                onDelete={deleteTransaction}
                onEdit={handleEdit}
                onToggleType={handleToggleType}
              />
            )}
          </Card>
        </section>
      </main>

      <footer style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        <p>&#169; {new Date().getFullYear()} Tracker.io. React + Supabase Personal Project.</p>
      </footer>
    </div>
  );
}
