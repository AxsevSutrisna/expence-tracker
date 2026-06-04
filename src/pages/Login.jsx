import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input } from '../components/ui';
import { LogIn, UserPlus } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
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
        setErrorMsg(res.error);
      }
    } else {
      if (!formData.email || !formData.password) {
        setErrorMsg('Email dan password tidak boleh kosong.');
        setLoading(false);
        return;
      }
      const res = await signInWithEmail(formData.email, formData.password);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
      <Card className="animate-in" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            Tracker<span style={{ color: '#3b82f6' }}>.io</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {isRegister ? 'Buat akun baru untuk mulai mencatat keuangan.' : 'Selamat datang kembali! Silakan masuk ke akun Anda.'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {isRegister && (
            <Input 
              label="Nama Lengkap" 
              id="fullName" 
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={handleInputChange}
            />
          )}
          <Input 
            label="Email" 
            id="email" 
            type="email" 
            placeholder="nama@email.com" 
            value={formData.email}
            onChange={handleInputChange}
          />
          <Input 
            label="Password" 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            value={formData.password}
            onChange={handleInputChange}
          />
          <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)', opacity: 0.5 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ATAU</span>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)', opacity: 0.5 }} />
        </div>

        <Button onClick={signInWithGoogle} variant="outline" style={{ width: '100%', padding: '0.75rem' }}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
          Lanjutkan dengan Google
        </Button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button 
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); setSuccessMsg(''); }} 
            style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isRegister ? 'Masuk di sini' : 'Daftar di sini'}
          </button>
        </div>
      </Card>
    </div>
  );
}
