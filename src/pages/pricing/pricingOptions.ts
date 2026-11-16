import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type {
  DiscountType,
  Promotion,
  PromotionStatus,
  PromotionTarget,
  ReferralRewardType,
  ReferralTrigger,
} from "@/types/pricing";
import type { CampaignPrice } from "@/api/types/response";
import { formatPrice } from "@/utils/format";

const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));

export const rewardTypeLabels: Record<ReferralRewardType, string> = {
  wallet_credit: "Wallet Credit",
  campaign_credit: "Campaign Credit",
};

export const triggerLabels: Record<ReferralTrigger, string> = {
  successful_referral: "Successful Referral",
  first_campaign: "First Campaign",
  first_wallet_funding: "First Wallet Funding",
};

export const discountTypeLabels: Record<DiscountType, string> = {
  percentage: "Percentage",
  fixed: "Fixed Amount",
};

export const promotionTargetLabels: Record<PromotionTarget, string> = {
  sms: "SMS Campaigns",
  image: "Image Campaigns",
  audience_rental: "Audience Rental",
};

/** "wallet_credit" → "Wallet Credit" for values without a label. */
const humanize = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

/** Label for an API reward type / trigger, falling back to a readable form of unknown values. */
export const rewardTypeLabel = (value: string) => rewardTypeLabels[value as ReferralRewardType] ?? humanize(value);
export const triggerLabel = (value: string) => triggerLabels[value as ReferralTrigger] ?? humanize(value);

export const discountTypeOptions = toOptions(discountTypeLabels);
export const promotionTargetOptions = toOptions(promotionTargetLabels);

export const servicePriceStatusStyles: Record<CampaignPrice["status"], BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  coming_soon: { label: "Coming Soon", variant: "warning", className: "text-amber-700" },
};

export const promotionStatusStyles: Record<PromotionStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "neutral" },
  expired: { label: "Expired", variant: "warning", className: "text-amber-700" },
};

export const promotionStatusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...toOptions({ active: "Active", scheduled: "Scheduled", expired: "Expired" } satisfies Record<PromotionStatus, string>),
];

export const promotionTargetFilterOptions = [{ label: "All Services", value: "all" }, ...promotionTargetOptions];

/** 10% or ₦2 */
export const formatDiscount = ({ discountType, discountValue }: Pick<Promotion, "discountType" | "discountValue">) =>
  discountType === "percentage" ? `${discountValue}%` : formatPrice(discountValue);
