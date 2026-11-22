import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Wallet } from 'lucide-react';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/hooks/useTheme';
import { Button } from '@shared/ui';
import { SalaryPlanner } from '@features/planner';

export default function PlannerPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Judul halaman yang deskriptif (SEO/aksesibilitas) — dipulihkan saat keluar.
  useEffect(() => {
    const prev = document.title;
    document.title = 'Perencana Gaji · Tracker.io';
    return () => {
      document.title = prev;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="planner-scope" style={{ minHeight: '100vh' }}>
      <div className="planner-wrap">
        <header className="planner-topbar">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="btn-icon"
              title="Kembali ke Dashboard"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="planner-brand">
              <span className="planner-brand-badge">
                <Wallet size={24} />
              </span>
              <div className="planner-title-group">
                <h1>Perencana Gaji</h1>
                <p>
                  Bagi gaji bulanan ke kebutuhan, keinginan, tabungan &amp; investasi — berbasis metode
                  50/30/20, Fidelity 50/15/5, dan Pay Yourself First.
                </p>
              </div>
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
          <SalaryPlanner user={user} />
        </main>

        <footer className="text-center text-secondary text-sm" style={{ marginTop: '1rem' }}>
          <p>&#169; {new Date().getFullYear()} Tracker.io · Perencana Gaji</p>
        </footer>
      </div>
    </div>
  );
}
