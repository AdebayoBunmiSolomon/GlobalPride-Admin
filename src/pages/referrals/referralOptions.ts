import { mockWalletLedger } from "@/data/mock";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { Referral, ReferralBonusStatus, ReferralStatus } from "@/types/referral";

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

/**
 * A referral's bonus, from its wallet transaction. Until a bonus is issued the
 * amount is the currently configured bonus (`configuredAmount`).
 */
export const getReferralBonus = (referral: Referral, configuredAmount: number) => {
  const transaction = referral.bonusTransactionId
    ? mockWalletLedger.find((item) => item.id === referral.bonusTransactionId)
    : undefined;

  const status: ReferralBonusStatus =
    transaction?.status === "successful" ? "paid" : transaction?.status === "failed" ? "failed" : "pending";

  return { status, amount: transaction?.amount ?? configuredAmount, transaction };
};
