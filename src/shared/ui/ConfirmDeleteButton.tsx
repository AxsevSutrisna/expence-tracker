import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './AlertDialog';

export interface ConfirmDeleteButtonProps {
  /** Dijalankan saat pengguna menekan tombol konfirmasi. */
  onConfirm: () => void;
  /** Teks tombol pemicu. */
  triggerLabel?: ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

/**
 * Tombol hapus dengan dialog konfirmasi (membungkus AlertDialog) agar pola
 * "konfirmasi sebelum hapus" konsisten di seluruh aplikasi.
 */
export function ConfirmDeleteButton({
  onConfirm,
  triggerLabel = 'Hapus',
  title = 'Hapus Data?',
  description = 'Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.',
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  className,
  style,
  disabled,
}: ConfirmDeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className={className} style={style} disabled={disabled}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
