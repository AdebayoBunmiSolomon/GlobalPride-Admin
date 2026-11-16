import { apiClient } from "@/api/axios/client";
import { normalizeResponse, unwrap } from "@/api/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from "@/api/types/request";
import type { AdminAuthResult, AdminProfile, AdminResponse, ApiError, LoginResult } from "@/api/types/response";

/** Admin sign-in uses the admin Identity API (`/identity/*`), not the mobile app's `/auth/*`. */
export const authService = {
  /** Rejects with a normalized `ApiError` (e.g. invalid credentials, or a non-admin account). */
  login: async (payload: LoginPayload): Promise<LoginResult> => {
    const { data } = await apiClient.post<AdminResponse<AdminAuthResult>>("/identity/login", payload);
    const result = unwrap(data, "We couldn't sign you in. Please try again.");

    if (!result.user?.role?.toLowerCase().includes("admin")) {
      const error: ApiError = {
        message: "This account doesn't have access to the Admin Console.",
        code: "NOT_AN_ADMIN",
      };
      throw error;
    }

    return { token: result.token, refreshToken: result.refreshToken, user: result.user };
  },

  /** The signed-in admin's profile (GET /identity/me); also refreshes it in `useAuth`. */
  me: async () => {
    const { data } = await apiClient.get<AdminResponse<AdminProfile>>("/identity/me", { useAuth: true });
    const profile = unwrap(data, "We couldn't load your profile.");
    useAuth.getState().setUser(profile);
    return profile;
  },

  /** Updates name / email (PUT /identity/me) and stores the returned profile. */
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await apiClient.put<AdminResponse<AdminProfile>>("/identity/me", payload, { useAuth: true });
    const profile = unwrap(data, "We couldn't update your profile.");
    useAuth.getState().setUser(profile);
    return { profile, message: data.message };
  },

  /**
   * Changes the password and signs every other device out. Resolves to the API's
   * message; if the response carries new tokens for this session, they're saved.
   */
  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await apiClient.post<AdminResponse<Partial<AdminAuthResult> | null>>(
      "/identity/change-password",
      payload,
      { useAuth: true },
    );
    // Success may carry no `result`, which `unwrap` would reject.
    const response = normalizeResponse(data);
    if (!response.success) unwrap(data, "We couldn't change your password.");
    const result = response.data;
    if (result?.token) {
      useAuth.getState().setCredentials({ token: result.token, refreshToken: result.refreshToken, user: result.user });
    }
    return data.message;
  },

  /**
   * Signs the admin out locally right away, then asks the server to revoke the
   * session. The server call is best-effort and sends the token explicitly
   * (not `useAuth: true`) so an expired token doesn't trigger a refresh.
   */
  signOut: (): void => {
    const { token, logout } = useAuth.getState();
    logout();
    if (token) {
      apiClient
        .post("/identity/logout", undefined, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => undefined);
    }
  },
};
