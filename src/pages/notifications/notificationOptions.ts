import { Bell, Megaphone, UserCog, UserStar, Wallet, type LucideIcon } from "lucide-react";

import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type {
  NotificationRecipient,
  NotificationSource,
  NotificationStatus,
  NotificationType,
} from "@/types/notification";

export const backToNotifications = { label: "Back to Notifications", to: "/notifications" };

export const notificationSourceStyles: Record<NotificationSource, BadgeStyle> = {
  admin: { label: "Admin", variant: "primary" },
  system: { label: "System", variant: "neutral" },
};

export const notificationStatusStyles: Record<NotificationStatus, BadgeStyle> = {
  sent: { label: "Sent", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "primary" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const notificationTypes: Record<NotificationType, { label: string; icon: LucideIcon }> = {
  announcement: { label: "Announcement", icon: Bell },
  wallet: { label: "Wallet", icon: Wallet },
  referral: { label: "Referral", icon: UserStar },
  campaign: { label: "Campaign", icon: Megaphone },
  account: { label: "Account", icon: UserCog },
};

const labelOptions = (entries: [string, { label: string }][]) => entries.map(([value, { label }]) => ({ label, value }));

export const sourceFilterOptions = [
  { label: "All Sources", value: "all" },
  ...labelOptions(Object.entries(notificationSourceStyles)),
];
export const typeFilterOptions = [{ label: "All Types", value: "all" }, ...labelOptions(Object.entries(notificationTypes))];
export const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...labelOptions(Object.entries(notificationStatusStyles)),
];

export const recipientLabel = (recipient: NotificationRecipient) =>
  recipient.scope === "all" ? "All Users" : recipient.userName;
