import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AdminProfile } from "@/api/types/response";
import { resetQueryStores } from "@/store/createQueryStore";

type Credentials = {
  token: string;
  refreshToken?: string | null;
  user?: AdminProfile | null;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  /** The signed-in administrator, from the login / refresh response. */
  user: AdminProfile | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => void;
  setCredentials: (credentials: Credentials) => void;
  setUser: (user: AdminProfile) => void;
  logout: () => void;
};

const signedOut = { token: null, refreshToken: null, user: null, isAuthenticated: false };

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      ...signedOut,
      login: ({ token, refreshToken = null, user = null }) =>
        set({ token, refreshToken, user, isAuthenticated: true }),
      setCredentials: ({ token, refreshToken, user }) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
          user: user ?? state.user,
        })),
      setUser: (user) => set({ user }),
      logout: () => {
        // Cached API data belongs to this session.
        resetQueryStores();
        set(signedOut);
      },
    }),
    {
      name: "globalpride-admin-auth",
      // v1: real API tokens. Sessions saved by the old mock login (v0) are signed out.
      version: 1,
      migrate: () => signedOut as AuthState,
    },
  ),
);

/** Display details for the signed-in administrator. */
export const useCurrentAdmin = () => {
  const user = useAuth((state) => state.user);
  return {
    name: user?.fullName || user?.email || "Administrator",
    email: user?.email ?? "",
    role: user?.role || "Admin",
    phone: user?.phone ?? null,
    lastLoginAt: user?.lastLoginAt ?? null,
  };
};
