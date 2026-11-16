import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
}

type ToastState = {
  toasts: Toast[];
  show: (toast: Omit<Toast, "id">, durationMs?: number) => number;
  dismiss: (id: number) => void;
};

let nextId = 1;

/** Transient toasts rendered by `WebAppToaster` (mounted once in `App`). */
export const useToast = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (toast, durationMs = 5000) => {
    const id = nextId++;
    // Keep the stack short so a burst of failing requests can't flood the screen.
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-4) }));
    if (durationMs > 0) window.setTimeout(() => get().dismiss(id), durationMs);
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
