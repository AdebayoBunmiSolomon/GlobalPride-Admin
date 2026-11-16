import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { mutate } from "@/api/utils/mutate";
import { bool, isRaw, nested, num, pick, text, type Raw } from "@/api/utils/raw";
import type {
  GeneralSettingsPayload,
  NotificationSettingsPayload,
  SecuritySettingsPayload,
} from "@/api/types/request";
import type { AdminResponse, AdminSettings, SmsBalance, SystemInfo } from "@/api/types/response";
import type { GeneralSettings, NotificationSettings, SecuritySettings } from "@/types/settings";

// Swagger documents the request bodies (AdminGeneralSettingsDto, …) but not
// the GET body, so it's read defensively: each section may come nested
// (`general`, `notifications`, `security`) or flat, with the request names.

const toGeneral = (raw: Raw): GeneralSettings => ({
  platformName: text(raw, "platformName", "name") ?? "",
  description: text(raw, "description", "platformDescription") ?? "",
  supportEmail: text(raw, "supportEmail") ?? "",
  supportPhone: text(raw, "supportPhone") ?? "",
  timeZone: text(raw, "timeZone", "defaultTimeZone") ?? "Africa/Lagos",
  logo: text(raw, "logo", "logoUrl") ?? "",
});

const toNotifications = (raw: Raw): NotificationSettings => ({
  campaign: bool(raw, "campaignNotifications") ?? true,
  wallet: bool(raw, "walletNotifications") ?? true,
  referral: bool(raw, "referralNotifications") ?? true,
  support: bool(raw, "supportNotifications") ?? true,
  account: bool(raw, "accountNotifications") ?? true,
  adminAnnouncements: bool(raw, "allowAnnouncements", "adminAnnouncements") ?? true,
});

const toSecurity = (raw: Raw): SecuritySettings => ({
  sessionTimeout: num(raw, "sessionTimeoutMinutes", "sessionTimeout") ?? 15,
  requireStrongPasswords: bool(raw, "requireStrongPasswords") ?? true,
});

const section = (raw: Raw, name: string) => {
  const inner = nested(raw, name);
  return Object.keys(inner).length > 0 ? inner : raw;
};

const toSettings = (result: unknown): AdminSettings => {
  const raw = isRaw(result) ? (isRaw(result.settings) ? result.settings : result) : {};
  return {
    general: toGeneral(section(raw, "general")),
    notifications: toNotifications(section(raw, "notifications")),
    security: toSecurity(section(raw, "security")),
  };
};

/** A PUT's `result` as full settings, if it looks like them (it may be just the section, or empty). */
const toSettingsOrNull = (result: unknown) =>
  isRaw(result) && (isRaw(result.general) || isRaw(result.settings)) ? toSettings(result) : null;

/** A simple value shown as text (dates are left as sent; the page formats what it recognises). */
const toDisplay = (value: unknown) =>
  typeof value === "boolean" ? (value ? "Yes" : "No") : value == null || value === "" ? "—" : String(value);

/** Admin Settings (`/admin/settings`). Every call rejects with a normalized `ApiError`. */
export const settingsService = {
  get: async (): Promise<AdminSettings> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/settings", { useAuth: true });
    return toSettings(unwrap(data, "We couldn't load the platform settings."));
  },

  updateGeneral: async (values: GeneralSettings) => {
    const payload: GeneralSettingsPayload = { ...values };
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>("/admin/settings/general", payload, { useAuth: true }),
      "We couldn't save the general settings.",
    );
    return { settings: toSettingsOrNull(result), message };
  },

  updateNotifications: async (values: NotificationSettings) => {
    const payload: NotificationSettingsPayload = {
      campaignNotifications: values.campaign,
      walletNotifications: values.wallet,
      referralNotifications: values.referral,
      supportNotifications: values.support,
      accountNotifications: values.account,
      allowAnnouncements: values.adminAnnouncements,
    };
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>("/admin/settings/notifications", payload, { useAuth: true }),
      "We couldn't save the notification settings.",
    );
    return { settings: toSettingsOrNull(result), message };
  },

  updateSecurity: async (values: SecuritySettings) => {
    const payload: SecuritySettingsPayload = {
      sessionTimeoutMinutes: values.sessionTimeout,
      requireStrongPasswords: values.requireStrongPasswords,
    };
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>("/admin/settings/security", payload, { useAuth: true }),
      "We couldn't save the security settings.",
    );
    return { settings: toSettingsOrNull(result), message };
  },

  smsBalance: async (): Promise<SmsBalance> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/settings/sms-balance", { useAuth: true });
    const raw = isRaw(data.result) ? data.result : {};
    const balance = num(raw, "balance", "units", "remainingUnits", "smsUnits", "credit");
    const available = bool(raw, "available", "isAvailable") ?? balance !== null;
    return {
      available,
      balance,
      message: text(raw, "message", "error") ?? (data.isSuccess ? null : (data.message ?? null)),
    };
  },

  systemInfo: async (): Promise<SystemInfo> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/settings/system-info", { useAuth: true });
    const result = unwrap(data, "We couldn't load the system information.");
    const raw = isRaw(result) ? result : {};
    // Flattens one level of nesting, e.g. { database: { status } } → "database status".
    return Object.entries(raw).flatMap(([name, value]) =>
      isRaw(value)
        ? Object.entries(value)
            .filter(([, inner]) => !isRaw(inner) && !Array.isArray(inner))
            .map(([innerName, inner]) => ({ key: `${name} ${innerName}`, value: toDisplay(inner) }))
        : Array.isArray(value)
          ? [{ key: name, value: value.filter((item) => !isRaw(item)).join(", ") || "—" }]
          : [{ key: name, value: toDisplay(pick({ value }, "value")) }],
    );
  },
};
