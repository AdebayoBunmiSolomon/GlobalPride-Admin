import type { BadgeVariant } from "@/components/Badge";
import type { AdminCampaignStatus, RecipientDeliveryStatus } from "@/api/types/response";

export type BadgeStyle = { label: string; variant: BadgeVariant; className?: string };

export const campaignStatusStyles: Record<AdminCampaignStatus, BadgeStyle> = {
  draft: { label: "Draft", variant: "neutral" },
  scheduled: { label: "Scheduled", variant: "info" },
  sending: { label: "Sending", variant: "primary" },
  completed: { label: "Completed", variant: "success", className: "text-green-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export const recipientStatusStyles: Record<RecipientDeliveryStatus, BadgeStyle> = {
  delivered: { label: "Delivered", variant: "success", className: "text-green-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  pending: { label: "Awaiting receipt", variant: "info" },
  unconfirmed: { label: "No receipt", variant: "warning", className: "text-amber-700" },
};

/** Unknown statuses (the API may add some) fall back to a neutral badge with the raw name. */
export const getCampaignStatusStyle = (status: string): BadgeStyle =>
  campaignStatusStyles[status as AdminCampaignStatus] ?? {
    label: status.replace(/^\w/, (c) => c.toUpperCase()),
    variant: "neutral",
  };

export const getRecipientStatusStyle = (status: string, label?: string | null): BadgeStyle => {
  const style = recipientStatusStyles[status as RecipientDeliveryStatus] ?? { label: status, variant: "neutral" };
  // The API's own label is more specific, e.g. "Sent (no receipt for this channel)".
  return label ? { ...style, label } : style;
};
