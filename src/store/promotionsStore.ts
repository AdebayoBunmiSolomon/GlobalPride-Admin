import { promotionsService } from "@/api/services/promotions";
import type { PromotionPayload } from "@/api/types/request";
import type { Promotion } from "@/types/pricing";
import { createQueryStore } from "./createQueryStore";

/** Every promotion; filtered in the browser. */
export const promotionsQuery = createQueryStore(() => promotionsService.listAll(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

export const usePromotions = () => promotionsQuery.useQuery();

/*
 * Promotion actions: call the API, then update the cached list. The status
 * depends on the dates, so when the API doesn't send the saved promotion back
 * the list is refetched.
 */

export const createPromotion = async (payload: PromotionPayload) => {
  const result = await promotionsService.create(payload);
  const created = result.promotion;
  if (created) promotionsQuery.setData([], (items) => [created, ...items.filter((item) => item.id !== created.id)]);
  else await promotionsQuery.fetch([], { force: true });
  return result;
};

export const updatePromotion = async (promotion: Promotion, payload: PromotionPayload) => {
  const result = await promotionsService.update(promotion.id, payload);
  const saved = result.promotion;
  if (saved) promotionsQuery.setData([], (items) => items.map((item) => (item.id === saved.id ? saved : item)));
  else await promotionsQuery.fetch([], { force: true });
  return result;
};

export const deletePromotion = async (promotion: Promotion) => {
  const result = await promotionsService.remove(promotion.id);
  promotionsQuery.setData([], (items) => items.filter((item) => item.id !== promotion.id));
  return result;
};
