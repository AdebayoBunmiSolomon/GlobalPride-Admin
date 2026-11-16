import { announcementsService } from "@/api/services/announcements";
import type { AnnouncementPayload } from "@/api/types/request";
import type { AdminAnnouncement } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";

export const announcementSummaryQuery = createQueryStore(() => announcementsService.summary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every announcement; searched, filtered and paged in the browser. */
export const announcementsQuery = createQueryStore(() => announcementsService.listAll(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One announcement by code (NOT-000012) or number, as it appears in the URL. */
export const announcementQuery = createQueryStore((id: string) => announcementsService.get(id), {
  keyOf: (id) => id,
  staleTime: 30_000,
});

export const useAnnouncementSummary = () => announcementSummaryQuery.useQuery();
export const useAnnouncementList = () => announcementsQuery.useQuery();
export const useAnnouncement = (id: string) => announcementQuery.useQuery(id);

const apply = (announcement: AdminAnnouncement) => {
  announcementsQuery.setData([], (items) => items.map((item) => (item.id === announcement.id ? announcement : item)));
  announcementQuery.setAllData((item) => (item.id === announcement.id ? announcement : item));
  announcementSummaryQuery.invalidate();
};

/** Refetches after a change the API didn't send back (sending / sent depends on the server). */
const refetch = async (code: string) => {
  announcementsQuery.invalidate();
  announcementSummaryQuery.invalidate();
  return announcementQuery.fetch([code], { force: true });
};

/** Resolves to the saved announcement when the API (or a refetch) provides it, so the page can open it. */
export const createAnnouncement = async (payload: AnnouncementPayload) => {
  const result = await announcementsService.create(payload);
  announcementsQuery.invalidate();
  announcementSummaryQuery.invalidate();
  const created = result.announcement;
  if (created) {
    announcementsQuery.setData([], (items) => [created, ...items.filter((item) => item.id !== created.id)]);
    announcementQuery.setData([created.code], () => created);
  }
  return result;
};

export const updateAnnouncement = async (announcement: AdminAnnouncement, payload: AnnouncementPayload) => {
  const result = await announcementsService.update(announcement.code, payload);
  if (result.announcement) apply(result.announcement);
  else await refetch(announcement.code);
  return result;
};

export const cancelAnnouncement = async (announcement: AdminAnnouncement) => {
  const result = await announcementsService.cancel(announcement.code);
  apply(result.announcement ?? { ...announcement, status: "cancelled" });
  return result;
};
