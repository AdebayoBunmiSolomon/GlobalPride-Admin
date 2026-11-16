import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import type {
  AdminResponse,
  AdminWalletSummary,
  AdminWalletTransaction,
  AdminWalletTransactionDetails,
  PagedResult,
} from "@/api/types/response";

/** Admin Wallet Management (`/admin/wallets`). Every call rejects with a normalized `ApiError`. */
export const walletsService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<AdminWalletSummary>>("/admin/wallets/summary", {
      useAuth: true,
    });
    return unwrap(data, "We couldn't load the wallet summary.");
  },

  /**
   * Every transaction, newest first (all pages). Search, filters and paging are
   * then done in the browser.
   */
  transactionsAll: async (): Promise<AdminWalletTransaction[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<AdminWalletTransaction>>>(
        "/admin/wallets/transactions",
        { params: { page, pageSize: MAX_PAGE_SIZE }, useAuth: true },
      );
      return unwrap(data, "We couldn't load wallet transactions.");
    });
    return pages.flatMap((page) => page.items);
  },

  /** `id` is the reference (GP-TRX-…) or the GUID. */
  transaction: async (id: string) => {
    const { data } = await apiClient.get<AdminResponse<AdminWalletTransactionDetails>>(
      `/admin/wallets/transactions/${encodeURIComponent(id)}`,
      { useAuth: true },
    );
    return unwrap(data, "We couldn't load this transaction.");
  },
};
