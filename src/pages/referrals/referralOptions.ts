import type { AdminReferral, ReferralBonusStatus, ReferralStatus } from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

export const referralStatusStyles: Record<ReferralStatus, BadgeStyle> = {
  pending: { label: "Pending", variant: "warning", className: "text-amber-700" },
  successful: { label: "Successful", variant: "success", className: "text-green-700" },
};

export const bonusStatusStyles: Record<ReferralBonusStatus, BadgeStyle> = {
  pending: { label: "Pending", variant: "warning", className: "text-amber-700" },
  paid: { label: "Paid", variant: "success", className: "text-green-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
};

export const referralStatusOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(referralStatusStyles).map(([value, { label }]) => ({ label, value })),
];

export const bonusStatusOptions = [
  { label: "All Bonus Statuses", value: "all" },
  ...Object.entries(bonusStatusStyles).map(([value, { label }]) => ({ label, value })),
];

/** Who was referred: the signed-up user's name, else the invited contact. */
export const referredLabel = (referral: AdminReferral) =>
  referral.referredUserName ?? referral.inviteeContact ?? "—";

/**
 * The referral's bonus amount; until the API reports one, a pending referral
 * shows the currently configured bonus (`configuredAmount`, null while loading).
 */
export const bonusAmountOf = (referral: AdminReferral, configuredAmount: number | null) =>
  referral.bonusAmount ?? (referral.bonusStatus === "pending" ? configuredAmount : null);
