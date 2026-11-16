import { settingsService } from "@/api/services/settings";
import type { AdminSettings } from "@/api/types/response";
import { useSettings } from "@/hooks/useSettings";
import type { GeneralSettings, NotificationSettings, SecuritySettings } from "@/types/settings";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/settings. Each load also refreshes the persisted `useSettings` cache. */
export const settingsQuery = createQueryStore(
  () =>
    settingsService.get().then((settings) => {
      useSettings.getState().apply(settings);
      return settings;
    }),
  { keyOf: () => "settings", staleTime: 5 * 60_000 },
);

export const smsBalanceQuery = createQueryStore(() => settingsService.smsBalance(), {
  keyOf: () => "sms-balance",
  staleTime: 60_000,
});

export const systemInfoQuery = createQueryStore(() => settingsService.systemInfo(), {
  keyOf: () => "system-info",
  staleTime: 5 * 60_000,
});

export const useAdminSettings = () => settingsQuery.useQuery();
export const useSmsBalance = () => smsBalanceQuery.useQuery();
export const useSystemInfo = () => systemInfoQuery.useQuery();

/** Puts saved settings in the cache: the server's copy if it sent one, else ours with the saved section. */
const applySettings = (fromServer: AdminSettings | null, change: Partial<AdminSettings>) => {
  const { general, notifications, security } = useSettings.getState();
  const next = fromServer ?? { general, notifications, security, ...change };
  settingsQuery.setData([], () => next);
  useSettings.getState().apply(next);
  return next;
};

export const saveGeneralSettings = async (values: GeneralSettings) => {
  const { settings, message } = await settingsService.updateGeneral(values);
  return { settings: applySettings(settings, { general: values }), message };
};

export const saveNotificationSettings = async (values: NotificationSettings) => {
  const { settings, message } = await settingsService.updateNotifications(values);
  return { settings: applySettings(settings, { notifications: values }), message };
};

export const saveSecuritySettings = async (values: SecuritySettings) => {
  const { settings, message } = await settingsService.updateSecurity(values);
  return { settings: applySettings(settings, { security: values }), message };
};
