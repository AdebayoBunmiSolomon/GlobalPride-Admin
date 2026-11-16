import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import type { SetCampaignPricePayload, SetReferralBonusPayload, SetVatRatePayload } from "@/api/types/request";
import type { AdminResponse, CampaignPriceKey, PricingSettings } from "@/api/types/response";

/**
 * Admin Pricing (`/admin/pricing`). Each update returns the full, updated
 * settings plus the API's message. Every call rejects with a normalized `ApiError`.
 */
export const pricingService = {
  /** Campaign prices, VAT rate and referral bonus. */
  get: async (signal?: AbortSignal) => {
    const { data } = await apiClient.get<AdminResponse<PricingSettings>>("/admin/pricing", { signal, useAuth: true });
    return unwrap(data, "We couldn't load pricing.");
  },

  setCampaignPrice: async (key: CampaignPriceKey, price: number) => {
    const body: SetCampaignPricePayload = { price };
    const { data } = await apiClient.put<AdminResponse<PricingSettings>>(`/admin/pricing/campaign/${key}`, body, {
      useAuth: true,
    });
    return { settings: unwrap(data, "We couldn't update this price."), message: data.message };
  },

  setVatRate: async (ratePercent: number) => {
    const body: SetVatRatePayload = { ratePercent };
    const { data } = await apiClient.put<AdminResponse<PricingSettings>>("/admin/pricing/vat", body, { useAuth: true });
    return { settings: unwrap(data, "We couldn't update the VAT rate."), message: data.message };
  },

  /** The wallet credit paid to the referrer for each successful referral. */
  setReferralBonus: async (amount: number) => {
    const body: SetReferralBonusPayload = { amount };
    const { data } = await apiClient.put<AdminResponse<PricingSettings>>("/admin/pricing/referral-bonus", body, {
      useAuth: true,
    });
    return { settings: unwrap(data, "We couldn't update the referral bonus."), message: data.message };
  },
};
