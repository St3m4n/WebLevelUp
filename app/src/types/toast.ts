export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastEntry = Required<Pick<ToastOptions, 'id'>> &
  Omit<ToastOptions, 'id'> & {
    variant: ToastVariant;
  };
