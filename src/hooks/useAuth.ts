import { create } from "zustand";
import { persist } from "zustand/middleware";

type Credentials = {
  token: string;
  refreshToken?: string | null;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => void;
  setCredentials: (credentials: Credentials) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: ({ token, refreshToken = null }) =>
        set({ token, refreshToken, isAuthenticated: true }),
      setCredentials: ({ token, refreshToken }) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      logout: () =>
        set({ token: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: "globalpride-admin-auth",
    },
  ),
);
