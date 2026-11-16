export type ReferralRewardType = "wallet_credit" | "campaign_credit";
export type ReferralTrigger = "successful_referral" | "first_campaign" | "first_wallet_funding";

export type DiscountType = "percentage" | "fixed";
export type PromotionTarget = "sms" | "image" | "audience_rental";
export type PromotionStatus = "active" | "scheduled" | "expired";

export interface Promotion {
  id: string;
  name: string;
  discountType: DiscountType;
  /** Percent (0–100) or naira amount, depending on `discountType`. */
  discountValue: number;
  appliesTo: PromotionTarget;
  status: PromotionStatus;
  /** Date only, "YYYY-MM-DD". */
  startDate: string;
  /** Date only, "YYYY-MM-DD". */
  endDate: string;
}
