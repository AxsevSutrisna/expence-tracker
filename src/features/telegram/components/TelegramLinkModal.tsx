import { useState, useEffect, useCallback } from 'react';
import { Send, CheckCircle2, Copy, Check, RefreshCw } from 'lucide-react';
import { Modal, Button, Loading } from '@shared/ui';
import { requestTelegramLinkCode, type TelegramLinkInfo } from '../services/telegramService';

export interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelegramLinkModal({ isOpen, onClose }: TelegramLinkModalProps) {
  const [info, setInfo] = useState<TelegramLinkInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInfo(await requestTelegramLinkCode());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat. Pastikan Edge Function sudah di-deploy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      load();
    }
  }, [isOpen, load]);

  const copyCommand = async () => {
    if (!info?.code) return;
    try {
      await navigator.clipboard.writeText(`/link ${info.code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard bisa gagal di konteks tertentu — abaikan */
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hubungkan Telegram"
      description="Catat pemasukan & pengeluaran langsung dari chat Telegram — cukup ketik, mis. 'bensin 100rb'."
    >
      {loading && !info ? (
        <Loading label="Menyiapkan kode..." />
      ) : error ? (
        <div className="flex flex-col gap-4">
          <div className="alert alert-error">{error}</div>
          <Button variant="outline" onClick={load} className="w-full">
            <RefreshCw size={16} /> Coba Lagi
          </Button>
        </div>
      ) : info?.linked ? (
        <div className="flex flex-col items-center text-center" style={{ gap: '1rem', padding: '1rem 0' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--color-text-income)' }} />
          <h3 className="font-bold text-lg">Akun sudah terhubung ✅</h3>
          <p className="text-sm text-secondary">
            Kirim pesan ke bot untuk mencatat, mis. <b>bensin 100rb</b> atau <b>gaji 4jt</b>. Transaksinya langsung muncul di sini.
          </p>
          {info.botUsername && (
            <Button variant="primary" onClick={() => window.open(`https://t.me/${info.botUsername}`, '_blank')}>
              <Send size={16} /> Buka Bot di Telegram
            </Button>
          )}
        </div>
      ) : info ? (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-2" style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li className="text-sm">Buka bot Telegram {info.botUsername ? <b>@{info.botUsername}</b> : ''}.</li>
            <li className="text-sm">Kirim perintah ini ke bot:</li>
          </ol>

          {/* Kode perintah */}
          <div
            className="flex items-center justify-between gap-3"
            style={{
              border: '4px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              padding: '0.75rem 1rem',
            }}
          >
            <code style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px' }}>/link {info.code}</code>
            <Button variant="outline" onClick={copyCommand} className="btn-icon" title="Salin">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>
          <p className="input-hint">Kode berlaku ~5 menit & sekali pakai.</p>

          {info.deepLink && (
            <Button variant="primary" className="w-full" onClick={() => window.open(info.deepLink!, '_blank')}>
              <Send size={16} /> Buka Telegram & Kirim Otomatis
            </Button>
          )}

          <div className="divider" style={{ margin: '0.25rem 0' }}>
            <hr />
            <span className="text-xs text-muted">SUDAH KIRIM?</span>
            <hr />
          </div>

          <Button variant="outline" onClick={load} className="w-full">
            <RefreshCw size={16} /> Periksa Status Koneksi
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
