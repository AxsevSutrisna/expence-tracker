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
    <div className="auth-container">
      <Card className="animate-in w-full" style={{ maxWidth: '400px' }}>
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-2">
            <img src="/expence-tracker.png" alt="Tracker Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <h1 className="text-primary font-extrabold" style={{ fontSize: '1.75rem', margin: 0 }}>
              Tracker<span className="text-blue">.io</span>
            </h1>
          </div>
          <p className="text-secondary text-sm">
            {isRegister ? 'Buat akun baru untuk mulai mencatat keuangan.' : 'Selamat datang kembali! Silakan masuk ke akun Anda.'}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4 mb-6">
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
          <Button type="submit" variant="primary" disabled={loading} className="w-full mt-2 p-3">
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk')}
          </Button>
        </form>

        <div className="divider">
          <hr />
          <span className="text-xs text-muted">ATAU</span>
          <hr />
        </div>

        <Button onClick={signInWithGoogle} variant="outline" className="w-full p-3">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
          Lanjutkan dengan Google
        </Button>

        <div className="text-center mt-6 text-sm text-secondary">
          {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button 
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); setSuccessMsg(''); }} 
            className="link-btn"
          >
            {isRegister ? 'Masuk di sini' : 'Daftar di sini'}
          </button>
        </div>
      </Card>
    </div>
  );
}
