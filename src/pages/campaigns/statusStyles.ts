import type { BadgeVariant } from "@/components/Badge";
import type { CampaignStatus, RecipientStatus } from "@/types/campaign";

export type BadgeStyle = { label: string; variant: BadgeVariant; className?: string };

export const campaignStatusStyles: Record<CampaignStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  completed: { label: "Completed", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "neutral" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const recipientStatusStyles: Record<RecipientStatus, BadgeStyle> = {
  delivered: { label: "Delivered", variant: "success", className: "text-green-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  pending: { label: "Pending", variant: "neutral" },
  not_sent: { label: "Not Sent", variant: "neutral" },
};
