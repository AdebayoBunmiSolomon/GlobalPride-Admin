import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import type {
  AdminCampaign,
  AdminCampaignDetails,
  AdminResponse,
  CampaignDeliveryReport,
  CampaignRecipient,
  CampaignRecipientDelivery,
  CampaignRecipientsPage,
  PagedResult,
} from "@/api/types/response";

/** The API's maximum page size; list calls fetch every page at this size and filter in the browser. */

const path = (id: string, suffix = "") => `/admin/campaigns/${encodeURIComponent(id)}${suffix}`;

/**
 * Admin Campaign Management (`/admin/campaigns`). `id` is the public reference
 * (GP-2026-…) or the campaign GUID. Every call rejects with a normalized `ApiError`.
 */
export const campaignsService = {
  /** Every campaign, newest first. */
  listAll: async (): Promise<AdminCampaign[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<AdminCampaign>>>("/admin/campaigns", {
        params: { page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load campaigns.");
    });
    return pages.flatMap((page) => page.items);
  },

  /** Rejects with status 404 / code CAMPAIGN_NOT_FOUND for an unknown id. */
  get: async (id: string) => {
    const { data } = await apiClient.get<AdminResponse<AdminCampaignDetails>>(path(id), { useAuth: true });
    return unwrap(data, "We couldn't load this campaign.");
  },

  deliveryReport: async (id: string) => {
    const { data } = await apiClient.get<AdminResponse<CampaignDeliveryReport>>(path(id, "/delivery-report"), {
      useAuth: true,
    });
    return unwrap(data, "We couldn't load the delivery report.");
  },

  /** Asks the SMS gateway for new receipts now (rate-limited), then returns the report. */
  refreshDeliveryReport: async (id: string) => {
    const { data } = await apiClient.post<AdminResponse<CampaignDeliveryReport>>(
      path(id, "/delivery-report/refresh"),
      undefined,
      { useAuth: true },
    );
    return unwrap(data, "We couldn't refresh the delivery report.");
  },

  /** Every per-recipient delivery row (status filtering and search happen in the browser). */
  deliveryRecipientsAll: async (id: string): Promise<CampaignRecipientDelivery[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<CampaignRecipientDelivery>>>(
        path(id, "/delivery-report/recipients"),
        { params: { page, pageSize: MAX_PAGE_SIZE }, useAuth: true },
      );
      return unwrap(data, "We couldn't load delivery statuses.");
    });
    return pages.flatMap((page) => page.items);
  },

  /** Everyone the campaign was addressed to, plus the API's note when there's no list. */
  recipientsAll: async (id: string): Promise<{ items: CampaignRecipient[]; note: string | null; perRecipientStatusAvailable: boolean }> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<CampaignRecipientsPage>>(path(id, "/recipients"), {
        params: { page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load recipients.");
    });
    return {
      items: pages.flatMap((page) => page.items),
      note: pages[0].note,
      perRecipientStatusAvailable: pages[0].perRecipientStatusAvailable,
    };
  },

  /** The per-recipient delivery report as a CSV file. */
  exportDeliveryReport: async (id: string): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get<Blob>(path(id, "/delivery-report/export"), {
      responseType: "blob",
      useAuth: true,
    });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    const filename = match ? decodeURIComponent(match[1] ?? match[2]) : `delivery-report-${id}.csv`;
    return { blob: response.data, filename };
  },
};
