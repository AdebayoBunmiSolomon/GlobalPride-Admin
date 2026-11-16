import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import { mutate } from "@/api/utils/mutate";
import { isRaw, num, oneOf, pick, text, unwrapItem, type Raw } from "@/api/utils/raw";
import type { PromotionPayload } from "@/api/types/request";
import type { AdminResponse, PagedResult } from "@/api/types/response";
import type { DiscountType, Promotion, PromotionStatus, PromotionTarget } from "@/types/pricing";

// Swagger documents the request body (AdminPromotionRequest) but not the
// response, so rows are read defensively (see utils/raw) with the request's
// field names first.

const DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"];
const TARGETS: PromotionTarget[] = ["sms", "image", "audience_rental"];
const STATUSES: PromotionStatus[] = ["active", "scheduled", "expired"];

/** "2026-09-01T00:00:00" → "2026-09-01". */
const toDate = (value: string | null) => (value ? value.slice(0, 10) : "");

const today = () => new Date().toLocaleDateString("en-CA");

/** The API's status, or (if it sent none) one worked out from the dates. */
const toStatus = (value: unknown, startDate: string, endDate: string): PromotionStatus => {
  const known = STATUSES.find((status) => status === String(value ?? "").toLowerCase());
  if (known) return known;
  const now = today();
  if (endDate && endDate < now) return "expired";
  if (startDate && startDate > now) return "scheduled";
  return "active";
};

const toPromotion = (raw: Raw): Promotion => {
  const startDate = toDate(text(raw, "startDate", "startsAt", "startAt"));
  const endDate = toDate(text(raw, "endDate", "endsAt", "endAt"));
  return {
    id: text(raw, "id", "promotionId") ?? "",
    name: text(raw, "name", "title") ?? "Untitled promotion",
    discountType: oneOf(DISCOUNT_TYPES, pick(raw, "discountType", "type"), "percentage"),
    discountValue: num(raw, "discountValue", "value", "discount") ?? 0,
    appliesTo: oneOf(TARGETS, pick(raw, "appliesTo", "service", "target"), "sms"),
    status: toStatus(pick(raw, "status"), startDate, endDate),
    startDate,
    endDate,
  };
};

const toPromotionOrNull = (result: unknown) => {
  const raw = unwrapItem(result, "promotion");
  return raw && pick(raw, "id") != null && pick(raw, "name", "discountType") != null ? toPromotion(raw) : null;
};

const path = (id: string) => `/admin/promotions/${encodeURIComponent(id)}`;

/** Admin Promotions (`/admin/promotions`). Every call rejects with a normalized `ApiError`. */
export const promotionsService = {
  /** Every promotion (all pages). */
  listAll: async (): Promise<Promotion[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>("/admin/promotions", {
        params: { status: "all", page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load promotions.");
    });
    return pages.flatMap((page) => page.items).filter(isRaw).map(toPromotion);
  },

  get: async (id: string): Promise<Promotion> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(path(id), { useAuth: true });
    return toPromotion(unwrapItem(unwrap(data, "We couldn't load this promotion."), "promotion") ?? {});
  },

  create: async (payload: PromotionPayload) => {
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>("/admin/promotions", payload, { useAuth: true }),
      "We couldn't create this promotion.",
    );
    return { promotion: toPromotionOrNull(result), message };
  },

  update: async (id: string, payload: PromotionPayload) => {
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>(path(id), payload, { useAuth: true }),
      "We couldn't update this promotion.",
    );
    return { promotion: toPromotionOrNull(result), message };
  },

  /** Prices go back to normal straight away. */
  remove: async (id: string) => {
    const { message } = await mutate(
      apiClient.delete<AdminResponse<unknown>>(path(id), { useAuth: true }),
      "We couldn't delete this promotion.",
    );
    return { message };
  },
};
