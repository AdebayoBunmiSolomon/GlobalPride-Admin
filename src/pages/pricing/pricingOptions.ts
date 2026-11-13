import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type {
  DiscountType,
  Promotion,
  PromotionStatus,
  PromotionTarget,
  ReferralBonusStatus,
  ReferralRewardType,
  ReferralTrigger,
  ServicePriceStatus,
} from "@/types/pricing";
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

export const rewardTypeOptions = toOptions(rewardTypeLabels);
export const triggerOptions = toOptions(triggerLabels);
export const discountTypeOptions = toOptions(discountTypeLabels);
export const promotionTargetOptions = toOptions(promotionTargetLabels);

export const servicePriceStatusStyles: Record<ServicePriceStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  coming_soon: { label: "Coming Soon", variant: "warning", className: "text-amber-700" },
};

export const referralStatusStyles: Record<ReferralBonusStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  inactive: { label: "Inactive", variant: "neutral" },
};

export const promotionStatusStyles: Record<PromotionStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "neutral" },
  expired: { label: "Expired", variant: "warning", className: "text-amber-700" },
};

export const referralStatusOptions = toOptions(
  { active: "Active", inactive: "Inactive" } satisfies Record<ReferralBonusStatus, string>,
);

export const promotionStatusOptions = toOptions(
  { active: "Active", scheduled: "Scheduled", expired: "Expired" } satisfies Record<PromotionStatus, string>,
);

/** 10% or ₦2 */
export const formatDiscount = ({ discountType, discountValue }: Pick<Promotion, "discountType" | "discountValue">) =>
  discountType === "percentage" ? `${discountValue}%` : formatPrice(discountValue);
