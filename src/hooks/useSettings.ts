import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AdminSettings } from "@/api/types/response";
import type { GeneralSettings, NotificationSettings, SecuritySettings } from "@/types/settings";

export const DEFAULT_PLATFORM_NAME = "Global Pride";

type SettingsState = AdminSettings & {
  /** Replaces the cached settings with the server's (see `settingsStore`). */
  apply: (settings: AdminSettings) => void;
};

/**
 * The last platform settings loaded from `GET /admin/settings`, persisted to
 * localStorage. The login page (shown before the admin API can be called)
 * uses it for the platform name and logo, and the sidebar, idle timeout and
 * password rule read it synchronously. Only `settingsStore` writes to it.
 * The values below are used until the first load.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      general: {
        platformName: DEFAULT_PLATFORM_NAME,
        description: "",
        supportEmail: "",
        supportPhone: "",
        logo: "",
        timeZone: "Africa/Lagos",
      } satisfies GeneralSettings,
      notifications: {
        campaign: true,
        wallet: true,
        referral: true,
        support: true,
        account: true,
        adminAnnouncements: true,
      } satisfies NotificationSettings,
      security: { sessionTimeout: 15, requireStrongPasswords: true } satisfies SecuritySettings,
      apply: ({ general, notifications, security }) =>
        set({ general: { ...general, platformName: general.platformName || DEFAULT_PLATFORM_NAME }, notifications, security }),
    }),
    { name: "globalpride-admin-settings", partialize: ({ general, notifications, security }) => ({ general, notifications, security }) },
  ),
);
