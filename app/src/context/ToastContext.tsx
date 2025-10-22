import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ToastViewport from '../components/ToastViewport';
import type { ToastEntry, ToastOptions } from '@/types/toast';
export type { ToastVariant } from '@/types/toast';

const DEFAULT_DURATION = 4000;

const ToastContext = createContext<{
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
} | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timeoutsRef = useRef(new Map<string, number>());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    ({
      id,
      title,
      description,
      variant = 'info',
      duration = DEFAULT_DURATION,
    }: ToastOptions) => {
      const toastId =
        id ??
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`);
      setToasts((prev) => [
        ...prev,
        {
          id: toastId,
          title,
          description,
          variant,
        },
      ]);

      if (duration > 0) {
        const timeout = window.setTimeout(() => {
          removeToast(toastId);
        }, duration);
        timeoutsRef.current.set(toastId, timeout);
      }

      return toastId;
    },
    [removeToast]
  );

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutsRef.current.clear();
    },
    []
  );

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
};
