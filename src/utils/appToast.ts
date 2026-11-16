import { useToast, type ToastType } from "@/hooks/useToast";

/**
 * Imperative toast API (same call shape as the mobile app's `appToast`), usable
 * outside React components — e.g. in API helpers.
 */
export const appToast = {
  show: (title: string, message?: string | null, type: ToastType = "info") =>
    useToast.getState().show({ title, message: message ?? undefined, type }),
  success: (message: string, title = "Success") => appToast.show(title, message, "success"),
  error: (message: string, title = "Error") => appToast.show(title, message, "error"),
};
