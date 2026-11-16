import axios from "axios";

import { appEnvironment } from "@/config/env";
import { useAuth } from "@/hooks/useAuth";
import type { RefreshTokenPayload } from "@/api/types/request";
import type { AdminAuthResult, AdminResponse } from "@/api/types/response";

export { handleApiError } from "./handleApiError";
export { getResponseMessage, isApiSuccess, normalizeResponse, unwrap } from "./isApiSuccess";

// Deliberately a separate, bare axios instance — NOT the intercepted
// apiClient. This call runs *inside* apiClient's own 401 interceptor, so
// reusing apiClient risks refresh → 401 → refresh … loops. It also keeps
// this module free of an import cycle back through client.ts.
const refreshClient = axios.create({
  baseURL: appEnvironment.apiUrl,
  timeout: 15000,
});

/** Current access token from the persisted auth store (attached by the request interceptor). */
export const getToken = (): string | null => useAuth.getState().token;

// Shared so concurrent 401s trigger a single refresh request.
let refreshPromise: Promise<string> | null = null;

/**
 * Exchanges the refresh token for a new access token, saves both tokens to
 * the auth store and returns the new access token. Called by the response
 * interceptor on 401.
 */
export const refreshToken = (): Promise<string> => {
  refreshPromise ??= (async () => {
    const { token, refreshToken: currentRefresh, setCredentials } = useAuth.getState();

    if (!currentRefresh) throw new Error("No refresh token");

    const payload: RefreshTokenPayload = { refreshToken: currentRefresh, token };
    const { data } = await refreshClient.post<AdminResponse<AdminAuthResult>>("/identity/refreshToken", payload);

    if (!data.isSuccess || !data.result?.token) {
      throw new Error(data.message ?? "Token refresh failed");
    }

    // Keeps the existing refresh token if the response doesn't rotate it.
    const { token: accessToken, refreshToken: nextRefresh, user } = data.result;
    setCredentials({ token: accessToken, refreshToken: nextRefresh, user });
    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/** Clears auth state (e.g. after a failed refresh); RequireAuth then redirects to the login page. */
export const onAuthError = () => {
  useAuth.getState().logout();
};
