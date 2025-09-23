import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Kind = "success" | "error" | "info";
type Toast = { id: string; kind: Kind; title: string; message?: string; timeout: number };

type Ctx = {
  show: (kind: Kind, title: string, message?: string, timeout?: number) => void;
  success: (title: string, message?: string, timeout?: number) => void;
  error: (title: string, message?: string, timeout?: number) => void;
  info: (title: string, message?: string, timeout?: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((kind: Kind, title: string, message?: string, timeout = 3500) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, kind, title, message, timeout };
    setToasts((prev) => [...prev, toast]);
    // auto-dismiss
    setTimeout(() => remove(id), timeout);
  }, [remove]);

  const value = useMemo<Ctx>(() => ({
    show,
    success: (t, m, ms) => show("success", t, m, ms),
    error: (t, m, ms) => show("error", t, m, ms),
    info: (t, m, ms) => show("info", t, m, ms),
  }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed z-[9999] right-4 bottom-4 flex flex-col gap-2">
          {toasts.map(t => (
            <div
              key={t.id}
              className={
                "min-w-[280px] max-w-[420px] rounded-xl border shadow-lg px-4 py-3 animate-fade-in " +
                (t.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                 : t.kind === "error" ? "border-red-200 bg-red-50 text-red-900"
                 : "border-sky-200 bg-sky-50 text-sky-900")
              }
            >
              <div className="font-semibold">{t.title}</div>
              {t.message && <div className="text-sm opacity-90">{t.message}</div>}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* animação opcional */
const css = `
@keyframes fade-in { from {opacity:0; transform: translateY(8px)} to {opacity:1; transform: translateY(0)} }
.animate-fade-in { animation: fade-in .18s ease-out both; }
`;
(function inject() {
  if (typeof document === "undefined") return;
  if (document.getElementById("toast-anim")) return;
  const style = document.createElement("style");
  style.id = "toast-anim";
  style.innerHTML = css;
  document.head.appendChild(style);
})();
