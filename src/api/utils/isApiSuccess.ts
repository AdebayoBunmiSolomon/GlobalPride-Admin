import type { AnyApiResponse, ApiError, ApiResponse } from "@/api/types/response";
import { appToast } from "@/utils/appToast";

/**
 * Reads either envelope (`ApiResponse` from most endpoints, `AdminResponse`
 * from `/identity/*`) as an `ApiResponse`.
 */
export const normalizeResponse = <T>(
  response: Partial<AnyApiResponse<T>> | null | undefined,
): Partial<ApiResponse<T>> => {
  if (!response) return {};
  if ("isSuccess" in response || "result" in response || "details" in response) {
    return {
      success: response.isSuccess,
      data: response.result,
      message: response.message,
      errorCode: response.code,
      errors: response.details,
    };
  }
  return response as Partial<ApiResponse<T>>;
};

/** The most useful message in a response: its `errors` (the real causes) first, then `message`. */
export const getResponseMessage = (response: Partial<AnyApiResponse> | null | undefined, fallback: string) => {
  const data = normalizeResponse(response);
  return Array.isArray(data.errors) && data.errors.length > 0 ? data.errors.join("\n") : (data.message || fallback);
};

/**
 * Checks an API response. If it failed, shows the error toast and returns false.
 * If it succeeded, optionally shows the success toast and returns true.
 */
export const isApiSuccess = <T>(
  response: AnyApiResponse<T> | null | undefined,
  fallbackMessage: string,
  showSuccessToast = false,
): boolean => {
  const data = normalizeResponse(response);
  if (!data.success) {
    appToast.show(data.errorCode ?? "Error", getResponseMessage(response, fallbackMessage), "error");
    return false;
  }
  if (showSuccessToast) appToast.show("Success", data.message, "success");
  return true;
};

/**
 * Returns the payload (`data` / `result`) of a successful response, or throws
 * a normalized `ApiError` for a failed one, so services reject the same way
 * for HTTP errors and for 200s that report a failure.
 */
export const unwrap = <T>(response: AnyApiResponse<T>, fallbackMessage = "Something went wrong"): T => {
  const data = normalizeResponse(response);
  if (!data.success || data.data == null) {
    const error: ApiError = {
      message: getResponseMessage(response, fallbackMessage),
      code: data.errorCode ?? undefined,
      errors: data.errors ?? undefined,
    };
    throw error;
  }
  return data.data;
};
