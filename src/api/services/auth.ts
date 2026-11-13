import type { ApiResponse } from "@/types/api-response";
import { apiClient } from "../axios/client";

export interface LoginPayload {
  email: string;
  password: string;
}

// TODO: confirm the response shape once the auth API is available.
export interface LoginResult {
  token: string;
  refreshToken?: string | null;
}

export const authService = {
  /** Rejects with a normalized `ApiError` (e.g. invalid credentials). */
  login: async (payload: LoginPayload) => {
    // TODO: replace with the real login endpoint path.
    const { data } = await apiClient.post<ApiResponse<LoginResult>>("/auth/login", payload);
    return data.result;
  },
};
