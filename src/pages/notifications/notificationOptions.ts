import type { AnnouncementStatus } from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

export const backToNotifications = { label: "Back to Notifications", to: "/notifications" };

export const announcementStatusStyles: Record<AnnouncementStatus, BadgeStyle> = {
  scheduled: { label: "Scheduled", variant: "primary" },
  sending: { label: "Sending", variant: "info", className: "text-blue-700" },
  sent: { label: "Sent", variant: "success", className: "text-green-700" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(announcementStatusStyles).map(([value, { label }]) => ({ label, value })),
];
