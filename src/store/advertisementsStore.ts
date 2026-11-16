import { advertisementsService } from "@/api/services/advertisements";
import type { AdvertisementPayload } from "@/api/types/request";
import type { AdminAdvertisement, AdvertisementStatus } from "@/api/types/response";
import { parseApiDate } from "@/utils/format";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/advertisements/summary. */
export const advertisementSummaryQuery = createQueryStore(() => advertisementsService.summary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every advertisement; searched, filtered and paged in the browser. */
export const advertisementsQuery = createQueryStore(() => advertisementsService.listAll(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One advertisement by code (AD-1001) or number, as it appears in the URL. */
export const advertisementQuery = createQueryStore((id: string) => advertisementsService.get(id), {
  keyOf: (id) => id,
  staleTime: 60_000,
});

export const useAdvertisementSummary = () => advertisementSummaryQuery.useQuery();
export const useAdvertisementList = () => advertisementsQuery.useQuery();
export const useAdvertisement = (id: string) => advertisementQuery.useQuery(id);

/** Active once the start time has arrived, otherwise Scheduled. */
const scheduleStatus = (startAt: string): AdvertisementStatus =>
  startAt && parseApiDate(startAt).getTime() > Date.now() ? "scheduled" : "active";

const sameAd = (a: AdminAdvertisement, b: Pick<AdminAdvertisement, "id">) => a.id === b.id;

/**
 * Puts an advertisement's new state in every cache that holds it. Counts in
 * the summary change with any mutation, so it's always marked stale.
 */
const applyChange = (ad: AdminAdvertisement) => {
  advertisementsQuery.setData([], (ads) => ads.map((cached) => (sameAd(cached, ad) ? ad : cached)));
  advertisementQuery.setAllData((cached) => (sameAd(cached, ad) ? ad : cached));
  advertisementSummaryQuery.invalidate();
};

/*
 * Advertisement actions: call the API, then update the cache so every page
 * reflects the change without refetching. Each rejects with the API's
 * `ApiError`. Responses aren't documented, so if one carries no advertisement
 * the cache is updated from what the action is known to do, and marked stale.
 */

/** Returns the new advertisement when the API sends it back. */
export const createAdvertisement = async (payload: AdvertisementPayload) => {
  const result = await advertisementsService.create(payload);
  advertisementsQuery.invalidate();
  advertisementSummaryQuery.invalidate();
  if (result.advertisement) {
    const ad = result.advertisement;
    advertisementsQuery.setData([], (ads) => [ad, ...ads.filter((cached) => !sameAd(cached, ad))]);
  }
  return result;
};

export const updateAdvertisement = async (ad: AdminAdvertisement, payload: AdvertisementPayload) => {
  const result = await advertisementsService.update(ad.code, payload);
  if (result.advertisement) {
    applyChange(result.advertisement);
  } else {
    // Refetch so the new creative URL and status are shown.
    advertisementsQuery.invalidate();
    advertisementSummaryQuery.invalidate();
    await advertisementQuery.fetch([ad.code], { force: true });
  }
  return result;
};

const changeStatus = async (
  ad: AdminAdvertisement,
  action: (id: string) => ReturnType<typeof advertisementsService.pause>,
  expected: AdvertisementStatus,
) => {
  const result = await action(ad.code);
  applyChange(result.advertisement ?? { ...ad, status: expected });
  if (!result.advertisement) {
    advertisementsQuery.invalidate();
    advertisementQuery.invalidate();
  }
  return result;
};

export const pauseAdvertisement = (ad: AdminAdvertisement) => changeStatus(ad, advertisementsService.pause, "paused");

export const resumeAdvertisement = (ad: AdminAdvertisement) =>
  changeStatus(ad, advertisementsService.resume, scheduleStatus(ad.startAt));

export const endAdvertisement = (ad: AdminAdvertisement) => changeStatus(ad, advertisementsService.end, "ended");

export const deleteAdvertisement = async (ad: AdminAdvertisement) => {
  const result = await advertisementsService.remove(ad.code);
  advertisementsQuery.setData([], (ads) => ads.filter((cached) => !sameAd(cached, ad)));
  advertisementQuery.remove([ad.code]);
  advertisementQuery.remove([ad.id]);
  advertisementSummaryQuery.invalidate();
  return result;
};
