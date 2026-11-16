import { apiClient } from "@/api/axios/client";
import { normalizeResponse, unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import type { AdvertisementPayload } from "@/api/types/request";
import type {
  AdminAdvertisement,
  AdminAdvertisementSummary,
  AdminResponse,
  AdvertisementStatus,
  PagedResult,
} from "@/api/types/response";
import { appEnvironment } from "@/config/env";
import { parseApiDate } from "@/utils/format";

/*
 * Swagger documents the summary, but no body for an advertisement (and the
 * sample list was empty), so rows are read defensively: each field is taken
 * from the first of a few likely names. Replace these readers with plain types
 * once documented.
 */
type Raw = Record<string, unknown>;

const isRaw = (value: unknown): value is Raw => typeof value === "object" && value !== null && !Array.isArray(value);

const pick = (raw: Raw, ...names: string[]) => names.map((name) => raw[name]).find((value) => value != null);
const text = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  return value == null || value === "" || isRaw(value) ? null : String(value);
};
const count = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  const number = Number(value);
  return value == null || value === "" || !Number.isFinite(number) ? null : number;
};

/** Site root the API is served under, e.g. "https://zairapay.com/globalpride". */
const siteRoot = String(appEnvironment.apiUrl ?? "").replace(/\/api(\/.*)?$/, "").replace(/\/+$/, "");

/** Creative URLs may come back relative to the server; make them loadable from the admin app. */
const toAbsoluteUrl = (value: string | null) => {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value;
  try {
    return value.startsWith("/") ? new URL(value, siteRoot).toString() : `${siteRoot}/${value}`;
  } catch {
    return value;
  }
};

const STATUSES: AdvertisementStatus[] = ["active", "scheduled", "paused", "ended"];

/** Status from the API, or (if it sent none we recognise) from the schedule. */
const toStatus = (value: unknown, startAt: string, endAt: string): AdvertisementStatus => {
  const name = String(value ?? "").toLowerCase();
  const known = STATUSES.find((status) => status === name);
  if (known) return known;
  const now = Date.now();
  if (endAt && parseApiDate(endAt).getTime() <= now) return "ended";
  if (startAt && parseApiDate(startAt).getTime() > now) return "scheduled";
  return "active";
};

const toAdvertisement = (raw: Raw): AdminAdvertisement => {
  const id = text(raw, "id", "advertisementId") ?? "";
  const startAt = text(raw, "startAt", "startDate", "startsAt") ?? "";
  const endAt = text(raw, "endAt", "endDate", "endsAt") ?? "";

  return {
    id,
    code: text(raw, "code", "reference", "advertisementCode") ?? id,
    name: text(raw, "name", "title") ?? "Untitled advertisement",
    advertiser: text(raw, "advertiser", "advertiserName", "businessName") ?? "",
    description: text(raw, "description") ?? "",
    creativeUrl: toAbsoluteUrl(text(raw, "creativeUrl", "creative", "imageUrl", "image", "mediaUrl")),
    ctaLabel: text(raw, "ctaLabel", "callToAction", "cta") ?? "Learn More",
    destinationUrl: text(raw, "destinationUrl", "url", "link") ?? "",
    placement: text(raw, "placement") ?? "home_feed",
    status: toStatus(pick(raw, "status"), startAt, endAt),
    createdAt: text(raw, "createdAt", "dateCreated"),
    startAt,
    endAt,
    impressions: count(raw, "impressions", "impressionCount", "totalImpressions"),
    clicks: count(raw, "clicks", "clickCount", "totalClicks"),
  };
};

/** A mutation's `result` read as an advertisement, if it is one (it may be empty or just a message). */
const toAdvertisementOrNull = (result: unknown) => {
  const raw = isRaw(result) && isRaw(result.advertisement) ? result.advertisement : result;
  return isRaw(raw) && pick(raw, "id", "advertisementId", "code") != null ? toAdvertisement(raw) : null;
};

const toFormData = (payload: AdvertisementPayload) => {
  const form = new FormData();
  form.append("Name", payload.name);
  form.append("Advertiser", payload.advertiser);
  form.append("Description", payload.description);
  form.append("CtaLabel", payload.ctaLabel);
  form.append("DestinationUrl", payload.destinationUrl);
  form.append("Placement", payload.placement);
  form.append("StartAt", payload.startAt);
  form.append("EndAt", payload.endAt);
  if (payload.creative) form.append("Creative", payload.creative);
  return form;
};

const path = (id: string) => `/admin/advertisements/${encodeURIComponent(id)}`;

/** Sends a mutation; succeeds even when the response carries no `result`. */
const mutate = async (request: Promise<{ data: AdminResponse<unknown> }>, fallbackMessage: string) => {
  const { data } = await request;
  const response = normalizeResponse(data);
  if (!response.success) unwrap(data, fallbackMessage);
  return { advertisement: toAdvertisementOrNull(response.data), message: data.message ?? null };
};

/** Admin Advertisement Management (`/admin/advertisements`). Every call rejects with a normalized `ApiError`. */
export const advertisementsService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<AdminAdvertisementSummary>>("/admin/advertisements/summary", {
      useAuth: true,
    });
    return unwrap(data, "We couldn't load the advertisement summary.");
  },

  /** Every advertisement (all pages). Search, filters and paging are then done in the browser. */
  listAll: async (): Promise<AdminAdvertisement[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>("/admin/advertisements", {
        params: { status: "all", page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load advertisements.");
    });
    return pages.flatMap((page) => page.items).filter(isRaw).map(toAdvertisement);
  },

  /** `id` is the number (1) or the code (AD-1001). */
  get: async (id: string): Promise<AdminAdvertisement> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(path(id), { useAuth: true });
    const result = unwrap(data, "We couldn't load this advertisement.");
    const raw = isRaw(result) && isRaw(result.advertisement) ? result.advertisement : result;
    return toAdvertisement(isRaw(raw) ? raw : {});
  },

  create: (payload: AdvertisementPayload) =>
    mutate(
      apiClient.post<AdminResponse<unknown>>("/admin/advertisements", toFormData(payload), {
        useAuth: true,
        timeout: 60_000,
      }),
      "We couldn't create this advertisement.",
    ),

  /** Leave `creative` out to keep the current image. Ended ads can't be edited. */
  update: (id: string, payload: AdvertisementPayload) =>
    mutate(
      apiClient.put<AdminResponse<unknown>>(path(id), toFormData(payload), { useAuth: true, timeout: 60_000 }),
      "We couldn't update this advertisement.",
    ),

  remove: (id: string) =>
    mutate(apiClient.delete<AdminResponse<unknown>>(path(id), { useAuth: true }), "We couldn't delete this advertisement."),

  pause: (id: string) =>
    mutate(
      apiClient.post<AdminResponse<unknown>>(`${path(id)}/pause`, null, { useAuth: true }),
      "We couldn't pause this advertisement.",
    ),

  resume: (id: string) =>
    mutate(
      apiClient.post<AdminResponse<unknown>>(`${path(id)}/resume`, null, { useAuth: true }),
      "We couldn't resume this advertisement.",
    ),

  /** Ends the ad now. An ended ad can't be resumed or edited. */
  end: (id: string) =>
    mutate(
      apiClient.post<AdminResponse<unknown>>(`${path(id)}/end`, null, { useAuth: true }),
      "We couldn't end this advertisement.",
    ),
};
