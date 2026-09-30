import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import styles from "../styles/Toast.module.css";

export type ToastKind = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const icons = { success: CircleCheck, error: CircleAlert, info: Info };

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const Icon = icons[toast.kind];

  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 4500);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  return (
    <div className={`${styles.toast} ${styles[toast.kind]}`} role={toast.kind === "error" ? "alert" : "status"}>
      <Icon size={19} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" aria-label="Tutup notifikasi" onClick={() => onDismiss(toast.id)}>
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const showToast = (message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }].slice(-4));
  };
  const dismissToast = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.region} aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider.");
  return context;
}