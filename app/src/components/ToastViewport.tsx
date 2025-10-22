import { createPortal } from 'react-dom';
import type { ToastEntry, ToastVariant } from '@/types/toast';
import styles from './ToastViewport.module.css';

type ToastViewportProps = {
  toasts: ToastEntry[];
  onDismiss: (id: string) => void;
};

const variantLabel: Record<ToastVariant, string> = {
  info: 'Información',
  success: 'Éxito',
  warning: 'Alerta',
  error: 'Error',
};

const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) {
    return null;
  }

  const content = (
    <div className={styles.viewport} role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[styles.toast, styles[toast.variant]].join(' ')}
        >
          <div className={styles.body}>
            <span className={styles.badge}>{variantLabel[toast.variant]}</span>
            <div className={styles.copy}>
              {toast.title && <strong>{toast.title}</strong>}
              {toast.description && <p>{toast.description}</p>}
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => onDismiss(toast.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(content, document.body);
};

export default ToastViewport;
