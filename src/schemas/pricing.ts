import * as yup from "yup";

import type {
  DiscountType,
  PromotionStatus,
  PromotionTarget,
  ReferralBonusStatus,
  ReferralRewardType,
  ReferralTrigger,
} from "@/types/pricing";

// Empty number inputs come through as "" → treat them as missing, not NaN.
const number = (message: string) =>
  yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError(message)
    .required(message);

export const servicePriceSchema = yup.object({
  price: number("Please enter a valid price.").moreThan(0, "Price must be greater than ₦0."),
});

export type ServicePriceValues = yup.InferType<typeof servicePriceSchema>;

export const vatRateSchema = yup.object({
  rate: number("Please enter a valid VAT rate.")
    .min(0, "Please enter a valid VAT rate.")
    .max(100, "VAT rate cannot be more than 100%."),
});

export type VatRateValues = yup.InferType<typeof vatRateSchema>;

export const referralBonusSchema = yup.object({
  amount: number("Please enter a valid bonus amount.").moreThan(0, "Bonus amount must be greater than ₦0."),
  rewardType: yup.mixed<ReferralRewardType>().oneOf(["wallet_credit", "campaign_credit"]).required(),
  trigger: yup
    .mixed<ReferralTrigger>()
    .oneOf(["successful_referral", "first_campaign", "first_wallet_funding"])
    .required(),
  status: yup.mixed<ReferralBonusStatus>().oneOf(["active", "inactive"]).required(),
});

export type ReferralBonusValues = yup.InferType<typeof referralBonusSchema>;

export const promotionSchema = yup.object({
  name: yup.string().trim().required("Please enter a promotion name."),
  discountType: yup.mixed<DiscountType>().oneOf(["percentage", "fixed"]).required(),
  discountValue: number("Please enter a discount value.")
    .moreThan(0, "Discount must be greater than 0.")
    .when("discountType", {
      is: "percentage",
      then: (schema) => schema.max(100, "Percentage discount cannot be more than 100%."),
    }),
  appliesTo: yup.mixed<PromotionTarget>().oneOf(["sms", "image", "audience_rental"]).required(),
  startDate: yup.string().required("Please choose a start date."),
  endDate: yup
    .string()
    .required("Please choose an end date.")
    .test("after-start", "End date must be on or after the start date.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !value || !startDate || value >= startDate;
    }),
  status: yup.mixed<PromotionStatus>().oneOf(["active", "scheduled", "expired"]).required(),
});

export type PromotionValues = yup.InferType<typeof promotionSchema>;
