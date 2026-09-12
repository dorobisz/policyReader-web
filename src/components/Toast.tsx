import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const COLORS: Record<ToastType, { border: string; bg: string; icon: string }> = {
  success: { border: "border-l-[#137333]", bg: "bg-[#e6f4ea]", icon: "text-[#137333]" },
  error:   { border: "border-l-error", bg: "bg-error-container/60", icon: "text-error" },
  warning: { border: "border-l-[#b06000]", bg: "bg-[#fef7e0]", icon: "text-[#b06000]" },
  info:    { border: "border-l-secondary", bg: "bg-secondary/10", icon: "text-secondary" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const dur = toast.durationMs ?? 4000;
    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.id, toast.durationMs, onRemove]);

  const c = COLORS[toast.type];
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={
        "w-80 max-w-[calc(100vw-2rem)] pointer-events-auto bg-white rounded-xl border border-outline-variant border-l-4 shadow-lg p-md flex items-start gap-sm transition-all duration-300 " +
        c.border + " " + c.bg + " " +
        (visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8")
      }
    >
      <span className={"material-symbols-outlined text-[20px] shrink-0 mt-0.5 filled " + c.icon}>{ICONS[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-label-bold text-label-bold text-on-surface">{toast.title}</p>
        {toast.message && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors ml-xs"
        aria-label="Zamknij powiadomienie"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-label="Powiadomienia systemowe"
      className="fixed bottom-lg right-lg z-50 flex flex-col gap-sm items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

let _counter = 0;
function genId() { return "toast-" + String(++_counter); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = genId();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const success = useCallback((title: string, msg?: string) => addToast({ type: "success", title, message: msg }), [addToast]);
  const error   = useCallback((title: string, msg?: string) => addToast({ type: "error", title, message: msg, durationMs: 6000 }), [addToast]);
  const warning = useCallback((title: string, msg?: string) => addToast({ type: "warning", title, message: msg }), [addToast]);
  const info    = useCallback((title: string, msg?: string) => addToast({ type: "info", title, message: msg }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}