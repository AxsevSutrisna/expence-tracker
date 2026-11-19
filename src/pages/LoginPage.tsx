import { useState } from 'react';
import { useAuth } from '@features/auth';
import { Button, Input } from '@shared/ui';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, BarChart3, Target, ScanLine } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LoginFormState {
  fullName: string;
  email: string;
  password: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<LoginFormState>({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegister) {
      if (!formData.fullName || !formData.email || !formData.password) {
        setErrorMsg('Harap lengkapi semua data pendaftaran.');
        setLoading(false);
        return;
      }
      const res = await signUpWithEmail(formData.email, formData.password, formData.fullName);
      if (res.success) {
        setSuccessMsg('Pendaftaran berhasil! Silakan cek email Anda jika verifikasi diaktifkan, atau langsung login.');
        setIsRegister(false);
      } else {
        setErrorMsg(res.error ?? 'Terjadi kesalahan.');
      }
    } else {
      if (!formData.email || !formData.password) {
        setErrorMsg('Email dan password tidak boleh kosong.');
        setLoading(false);
        return;
      }
      const res = await signInWithEmail(formData.email, formData.password);
      if (!res.success) {
        setErrorMsg(res.error ?? 'Terjadi kesalahan.');
      }
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-in">
        {/* BRAND / WELCOME PANEL */}
        <aside className="auth-brand">
          <div className="auth-brand-logo">
            <img src="/expence-tracker.png" alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <h1>Tracker<span className="text-blue">.io</span></h1>
          </div>

          <p className="auth-brand-tagline">
            Catat, pantau, dan kendalikan keuangan pribadimu — dalam satu tempat.
          </p>

          <ul className="auth-features">
            <li className="auth-feature">
              <span className="auth-feature-ico"><BarChart3 size={18} /></span>
              Analitik &amp; laporan keuangan
            </li>
            <li className="auth-feature">
              <span className="auth-feature-ico"><Target size={18} /></span>
              Budget &amp; langganan otomatis
            </li>
            <li className="auth-feature">
              <span className="auth-feature-ico"><ScanLine size={18} /></span>
              Scan struk otomatis dengan AI
            </li>
          </ul>
        </aside>

        {/* FORM PANEL */}
        <div className="auth-form">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="auth-form-title">{isRegister ? 'Buat Akun Baru' : 'Masuk'}</h2>
            <p className="auth-form-sub">
              {isRegister ? 'Mulai catat keuanganmu hari ini.' : 'Selamat datang kembali! 👋'}
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            {isRegister && (
              <Input
                label="Nama Lengkap"
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
            />
            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '40px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px',
                  display: 'flex',
                }}
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
              style={{ height: '48px', marginTop: '0.25rem' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (isRegister ? <UserPlus size={18} /> : <LogIn size={18} />)}
              {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
            </Button>
          </form>

          <div className="divider" style={{ marginTop: '1.25rem' }}>
            <hr />
            <span className="text-xs text-muted">ATAU</span>
            <hr />
          </div>

          <Button onClick={signInWithGoogle} variant="outline" className="w-full" style={{ height: '48px' }}>
            <GoogleIcon />
            Lanjutkan dengan Google
          </Button>

          <p className="text-center text-sm text-secondary" style={{ marginTop: '1.5rem' }}>
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button onClick={toggleMode} className="link-btn">
              {isRegister ? 'Masuk di sini' : 'Daftar di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
