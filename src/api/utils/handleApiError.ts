import type { ApiError } from "@/api/types/response";
import { appToast } from "@/utils/appToast";

interface HandleApiErrorOptions {
  /** Shown when the error has no message of its own. */
  fallbackMessage?: string;
  /** Toast title when the error has no code of its own. */
  fallbackCode?: string;
  /** If true, always use fallbackMessage/fallbackCode and ignore the API's own message. */
  forceFallback?: boolean;
}

/** Shows an error toast for a rejected request (or any thrown value). */
export const handleApiError = (error: unknown, options: HandleApiErrorOptions = {}) => {
  const { fallbackMessage = "Something went wrong", fallbackCode = "Error", forceFallback = false } = options;
  const apiError = (error ?? {}) as Partial<ApiError>;

  if (import.meta.env.DEV) console.error("[API]", error);

  // `errors` holds the real cause; `message` is often generic ("Validation failed.")
  const message = forceFallback
    ? fallbackMessage
    : Array.isArray(apiError.errors) && apiError.errors.length > 0
      ? apiError.errors.join("\n")
      : apiError.message || fallbackMessage;

  const code = forceFallback ? fallbackCode : (apiError.code ?? fallbackCode);

  appToast.show(code, message, "error");
};
