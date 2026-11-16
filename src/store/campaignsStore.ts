import { campaignsService } from "@/api/services/campaigns";
import { createQueryStore } from "./createQueryStore";

/** Every campaign; search, filters, sorting and paging run in the browser. */
export const campaignListQuery = createQueryStore(() => campaignsService.listAll(), { keyOf: () => "all" });

/** GET /admin/campaigns/{reference}. */
export const campaignDetailsQuery = createQueryStore((id: string) => campaignsService.get(id), { keyOf: (id) => id });

/** Delivery report; receipts keep arriving after a send, so it goes stale after 30 seconds. */
export const deliveryReportQuery = createQueryStore((id: string) => campaignsService.deliveryReport(id), {
  keyOf: (id) => id,
  staleTime: 30_000,
});

/** Who the campaign was addressed to (all pages). */
export const campaignRecipientsQuery = createQueryStore((id: string) => campaignsService.recipientsAll(id), {
  keyOf: (id) => id,
});

/** Per-recipient delivery status (all pages). */
export const deliveryRecipientsQuery = createQueryStore((id: string) => campaignsService.deliveryRecipientsAll(id), {
  keyOf: (id) => id,
  staleTime: 30_000,
});

export const useCampaignList = () => campaignListQuery.useQuery();
export const useCampaignDetails = (id: string) => campaignDetailsQuery.useQuery(id);
export const useDeliveryReport = (id: string) => deliveryReportQuery.useQuery(id);
export const useCampaignRecipients = (id: string) => campaignRecipientsQuery.useQuery(id);
export const useDeliveryRecipients = (id: string) => deliveryRecipientsQuery.useQuery(id);

/**
 * Asks the SMS gateway for new delivery receipts (rate-limited by the API), stores
 * the new report and marks the per-recipient statuses and campaign list stale.
 * Rejects with the API's `ApiError`.
 */
export const refreshDeliveryReport = async (id: string) => {
  const report = await campaignsService.refreshDeliveryReport(id);
  deliveryReportQuery.setData([id], () => report);
  deliveryRecipientsQuery.invalidate([id]);
  campaignListQuery.invalidate();
  return report;
};

/** Downloads the per-recipient delivery report CSV. Rejects with the API's `ApiError`. */
export const downloadDeliveryReport = async (id: string) => {
  const { blob, filename } = await campaignsService.exportDeliveryReport(id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
