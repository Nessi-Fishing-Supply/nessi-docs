'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import styles from './toast.module.scss';

interface Toast {
  id: number;
  message: string;
  color?: string;
}

interface ToastContextValue {
  showToast: (message: string, color?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, color?: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className={styles.container}>
          {toasts.map((toast) => (
            <div key={toast.id} className={styles.toast}>
              {toast.color && (
                <span className={styles.dot} style={{ background: toast.color }} />
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
