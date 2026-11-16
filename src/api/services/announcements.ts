import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import { mutate } from "@/api/utils/mutate";
import { isRaw, nested, num, oneOf, pick, text, unwrapItem, type Raw } from "@/api/utils/raw";
import type { AnnouncementPayload } from "@/api/types/request";
import type {
  AdminAnnouncement,
  AdminAnnouncementSummary,
  AdminResponse,
  AnnouncementStatus,
  PagedResult,
} from "@/api/types/response";

// Swagger documents the request body (AdminAnnouncementRequest) but not the
// responses, so rows are read defensively (see utils/raw).

const STATUSES: AnnouncementStatus[] = ["scheduled", "sending", "sent", "cancelled"];

const toAnnouncement = (raw: Raw): AdminAnnouncement => {
  const id = text(raw, "id", "number", "announcementId") ?? "";
  const status = String(pick(raw, "status") ?? "").toLowerCase() === "canceled" ? "cancelled" : pick(raw, "status");
  return {
    id,
    code: text(raw, "code", "reference", "notificationCode") ?? id,
    title: text(raw, "title") ?? "Untitled announcement",
    message: text(raw, "message", "body") ?? "",
    status: oneOf(STATUSES, status, "scheduled"),
    createdAt: text(raw, "createdAt", "dateCreated"),
    scheduledAt: text(raw, "scheduledAt", "scheduledFor", "sendAt"),
    sentAt: text(raw, "sentAt", "deliveredAt", "completedAt"),
    recipients: num(raw, "recipients", "recipientCount", "totalRecipients", "deliveredCount"),
    readCount: num(raw, "readCount", "reads", "openedCount"),
    createdBy: text(raw, "createdByName", "createdBy", "adminName") ?? text(nested(raw, "createdBy"), "fullName", "name"),
  };
};

const toAnnouncementOrNull = (result: unknown) => {
  const raw = unwrapItem(result, "announcement");
  return raw && pick(raw, "id", "code") != null && pick(raw, "title", "status") != null ? toAnnouncement(raw) : null;
};

const toSummary = (result: unknown): AdminAnnouncementSummary => {
  const raw = isRaw(result) ? { ...result, ...nested(result, "byStatus", "counts") } : {};
  return {
    total: num(raw, "total", "totalAnnouncements", "all"),
    scheduled: num(raw, "scheduled"),
    sending: num(raw, "sending"),
    sent: num(raw, "sent"),
    cancelled: num(raw, "cancelled", "canceled"),
  };
};

const path = (id: string) => `/admin/announcements/${encodeURIComponent(id)}`;

/** Admin Announcements (`/admin/announcements`). Every call rejects with a normalized `ApiError`. */
export const announcementsService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/announcements/summary", { useAuth: true });
    return toSummary(unwrap(data, "We couldn't load the announcement summary."));
  },

  /** Every announcement, newest first (all pages). Search, filters and paging are done in the browser. */
  listAll: async (): Promise<AdminAnnouncement[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>("/admin/announcements", {
        params: { status: "all", page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load announcements.");
    });
    return pages.flatMap((page) => page.items).filter(isRaw).map(toAnnouncement);
  },

  /** `id` is the number (12) or the code (NOT-000012). */
  get: async (id: string): Promise<AdminAnnouncement> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(path(id), { useAuth: true });
    return toAnnouncement(unwrapItem(unwrap(data, "We couldn't load this announcement."), "announcement") ?? {});
  },

  create: async (payload: AnnouncementPayload) => {
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>("/admin/announcements", payload, { useAuth: true }),
      "We couldn't create this announcement.",
    );
    return { announcement: toAnnouncementOrNull(result), message };
  },

  /** Scheduled announcements only. */
  update: async (id: string, payload: AnnouncementPayload) => {
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>(path(id), payload, { useAuth: true }),
      "We couldn't update this announcement.",
    );
    return { announcement: toAnnouncementOrNull(result), message };
  },

  /** Scheduled announcements only; the cancelled announcement stays in the history. */
  cancel: async (id: string) => {
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${path(id)}/cancel`, null, { useAuth: true }),
      "We couldn't cancel this announcement.",
    );
    return { announcement: toAnnouncementOrNull(result), message };
  },
};
