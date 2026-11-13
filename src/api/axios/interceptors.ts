import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import type { ApiError, ApiErrorResponse } from "@/types/api-response";
import { getToken, onAuthError, refreshToken } from "@/utils/api-utils";

const toApiError = (error: AxiosError<ApiErrorResponse>): ApiError => ({
  message:
    error.response?.data?.message || error.message || "An error occurred",
  status: error.response?.status,
  code: error.response?.data?.code,
  details: error.response?.data?.details,
});

// Request: attach the Bearer token only when `useAuth: true` is passed.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.useAuth) {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    config.metadata = { startTime: Date.now() };
  }

  return config;
});

// Response: log timings in dev, refresh on 401, normalize errors to ApiError.
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(
        `[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`,
      );
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;

    // Only retry authenticated requests, so the refresh call itself (and
    // e.g. a failed login) can't loop back into another refresh.
    if (
      error.response?.status === 401 &&
      originalRequest?.useAuth &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        onAuthError();
      }
    }

    return Promise.reject(toApiError(error));
  },
);
