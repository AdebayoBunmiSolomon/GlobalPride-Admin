import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { GeneralSettings, NotificationSettings, SecuritySettings } from "@/types/settings";

export const DEFAULT_PLATFORM_NAME = "Global Pride";

type SettingsState = {
  general: GeneralSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  setGeneral: (general: GeneralSettings) => void;
  setNotifications: (notifications: NotificationSettings) => void;
  setSecurity: (security: SecuritySettings) => void;
};

// Platform settings, persisted to localStorage so they survive a reload.
// Replace with the settings API once it exists.
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
      },
      notifications: {
        campaign: true,
        wallet: true,
        referral: true,
        support: true,
        account: true,
        adminAnnouncements: true,
      },
      security: { sessionTimeout: 15, requireStrongPasswords: true },
      setGeneral: (general) => set({ general }),
      setNotifications: (notifications) => set({ notifications }),
      setSecurity: (security) => set({ security }),
    }),
    { name: "globalpride-admin-settings" },
  ),
);
