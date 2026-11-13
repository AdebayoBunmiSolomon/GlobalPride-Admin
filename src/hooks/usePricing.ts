import { create } from "zustand";

import { mockPromotions, mockReferralBonus, mockServicePrices, mockVatRate } from "@/data/mock";
import type { Promotion, ReferralBonus, ServicePrice } from "@/types/pricing";

// In-memory pricing state so edits show on both the pricing and promotions
// pages. Replace with service calls once the pricing API exists.
type PricingState = {
  services: ServicePrice[];
  vatRate: number;
  referralBonus: ReferralBonus;
  promotions: Promotion[];
  setServicePrice: (id: string, price: number) => void;
  setVatRate: (rate: number) => void;
  setReferralBonus: (bonus: ReferralBonus) => void;
  createPromotion: (promotion: Omit<Promotion, "id">) => void;
  updatePromotion: (id: string, promotion: Omit<Promotion, "id">) => void;
};

export const usePricing = create<PricingState>()((set) => ({
  services: mockServicePrices,
  vatRate: mockVatRate,
  referralBonus: mockReferralBonus,
  promotions: mockPromotions,
  setServicePrice: (id, price) =>
    set((state) => ({
      services: state.services.map((service) => (service.id === id ? { ...service, price } : service)),
    })),
  setVatRate: (vatRate) => set({ vatRate }),
  setReferralBonus: (referralBonus) => set({ referralBonus }),
  createPromotion: (promotion) =>
    set((state) => ({
      promotions: [
        ...state.promotions,
        { ...promotion, id: `PROMO-${Date.now()}` },
      ],
    })),
  updatePromotion: (id, promotion) =>
    set((state) => ({
      promotions: state.promotions.map((item) => (item.id === id ? { ...promotion, id } : item)),
    })),
}));
