import { apiClient } from "@/api/axios/client";
import { useAuth } from "@/hooks/useAuth";
import type { ApiResponse } from "@/types/api-response";

type RefreshResult = { token: string; refreshToken?: string };

/** Current access token from the persisted auth store. */
export const getToken = (): string | null => useAuth.getState().token;

// Shared so concurrent 401s trigger a single refresh request.
let refreshPromise: Promise<string> | null = null;

/**
 * Exchanges the refresh token for a new access token, saves it to the
 * auth store and returns it. Called by the response interceptor on 401.
 */
export const refreshToken = (): Promise<string> => {
  refreshPromise ??= (async () => {
    const { token, refreshToken: currentRefresh, setCredentials } =
      useAuth.getState();

    if (!currentRefresh) {
      throw new Error("No refresh token");
    }

    // TODO: confirm endpoint with the backend.
    const { data } = await apiClient.post<ApiResponse<RefreshResult>>(
      "/api/v1/identity/refreshToken",
      { refreshToken: currentRefresh, token },
    );

    if (!data.isSuccess || !data.result?.token) {
      throw new Error(data.message ?? "Token refresh failed");
    }

    setCredentials(data.result);
    return data.result.token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/** Clears auth state; RequireAuth then redirects to the login page. */
export const onAuthError = () => {
  useAuth.getState().logout();
};
