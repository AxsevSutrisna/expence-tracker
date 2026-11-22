import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Kalimat singkat di bawah judul: menjelaskan fungsi form & hasilnya. */
  description?: ReactNode;
  children?: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className="modal-header">
          <div className="modal-heading">
            {title && <h2 id={titleId}>{title}</h2>}
            {description && <p className="modal-desc">{description}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
