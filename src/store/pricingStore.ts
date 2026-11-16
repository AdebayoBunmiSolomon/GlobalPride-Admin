import { pricingService } from "@/api/services/pricing";
import type { CampaignPriceKey, PricingSettings } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";
import { referralSummaryQuery } from "./referralsStore";

/** GET /admin/pricing: campaign prices, VAT rate and referral bonus. */
export const pricingQuery = createQueryStore(() => pricingService.get(), { keyOf: () => "all" });

export const usePricingSettings = () => pricingQuery.useQuery();

/** The configured referral bonus, or `undefined` until pricing has loaded. */
export const useReferralBonusSettings = () => usePricingSettings().data?.referralBonus;

/*
 * Pricing updates: each PUT returns the full updated settings, which replace the
 * cache. Each resolves to the API's message and rejects with its `ApiError`.
 */

const store = ({ settings, message }: { settings: PricingSettings; message?: string | null }) => {
  pricingQuery.setData([], () => settings);
  return message;
};

export const updateCampaignPrice = async (key: CampaignPriceKey, price: number) =>
  store(await pricingService.setCampaignPrice(key, price));

export const updateVatRate = async (ratePercent: number) => store(await pricingService.setVatRate(ratePercent));

export const updateReferralBonus = async (amount: number) => {
  const message = store(await pricingService.setReferralBonus(amount));
  // The referral summary reports the current bonus too.
  referralSummaryQuery.invalidate();
  return message;
};
