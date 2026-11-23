import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, PiggyBank } from 'lucide-react';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/hooks/useTheme';
import { Button } from '@shared/ui';
import { SavingsManager } from '@features/savings';

export default function SavingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.title;
    document.title = 'Tabungan · Tracker.io';
    return () => {
      document.title = prev;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="savings-scope" style={{ minHeight: '100vh' }}>
      <div className="savings-wrap">
        <header className="savings-topbar">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="btn-icon"
            title="Kembali ke Dashboard"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="savings-brand">
            <span className="savings-brand-badge">
              <PiggyBank size={24} />
            </span>
            <div className="savings-title-group">
              <h1>Tabungan</h1>
              <p>
                Buat target, atur rencana menabung per hari/minggu/bulan, lacak progres, dan dapat pengingat
                agar targetmu tercapai.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={toggleTheme}
            className="btn-icon"
            title="Ganti Tema"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </header>

        <main>
          <SavingsManager user={user} />
        </main>

        <footer className="text-center text-secondary text-sm" style={{ marginTop: '1rem' }}>
          <p>&#169; {new Date().getFullYear()} Tracker.io · Tabungan</p>
        </footer>
      </div>
    </div>
  );
}
