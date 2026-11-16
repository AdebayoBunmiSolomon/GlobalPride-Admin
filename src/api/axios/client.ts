import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { getToken, normalizeResponse, onAuthError, refreshToken } from "@/api/utils";
import { appEnvironment } from "@/config/env";
import type { AnyApiResponse, ApiError } from "@/api/types/response";

export const apiClient = axios.create({
  baseURL: appEnvironment.apiUrl,
  timeout: 15000,
});

/** Normalizes any axios failure into the `ApiError` every rejected request rejects with. */
const toApiError = (error: AxiosError<Partial<AnyApiResponse>>): ApiError => {
  const body = normalizeResponse(error.response?.data);

  if (!error.response) {
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    return {
      message: timedOut
        ? "The request timed out. Please try again."
        : "Can't reach the server. Check your internet connection and try again.",
      code: error.code ?? "NETWORK_ERROR",
    };
  }

  return {
    message: body.message || error.message || "Something went wrong",
    status: error.response.status,
    code: body.errorCode ?? undefined,
    errors: Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : undefined,
  };
};

// Request: attach the Bearer token only when `useAuth: true` is passed.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.useAuth) {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) config.metadata = { startTime: Date.now() };

  return config;
});

// Response: log timings in dev, refresh on 401, normalize errors to ApiError.
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error: AxiosError<Partial<AnyApiResponse>>) => {
    const originalRequest = error.config;

    // Only retry authenticated requests, so e.g. a failed login can't trigger a refresh.
    if (error.response?.status === 401 && originalRequest?.useAuth && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed: the session is over. Logging out sends the admin back to sign in.
        onAuthError();
      }
    }

    return Promise.reject(toApiError(error));
  },
);
