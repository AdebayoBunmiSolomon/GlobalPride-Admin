import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { useToast, type ToastType } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

const typeStyles: Record<ToastType, { icon: typeof Info; iconClass: string; bar: string }> = {
  success: { icon: CircleCheck, iconClass: "text-green-600", bar: "bg-green-500" },
  error: { icon: CircleAlert, iconClass: "text-red-600", bar: "bg-red-500" },
  info: { icon: Info, iconClass: "text-primary", bar: "bg-primary" },
};

interface WebAppToasterProps {
  containerClassName?: string;
}

/** Renders toasts from `useToast` / `appToast`. Mount once, at the app root. */
export const WebAppToaster = ({ containerClassName }: WebAppToasterProps) => {
  const toasts = useToast((state) => state.toasts);
  const dismiss = useToast((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-96",
        containerClassName,
      )}
    >
      {toasts.map((toast) => {
        const { icon: Icon, iconClass, bar } = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className="pointer-events-auto relative flex w-full gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white py-3 pr-10 pl-4 shadow-lg"
          >
            <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", bar)} />
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-sm whitespace-pre-line text-gray-600">{toast.message}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="absolute top-2.5 right-2.5 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
