import { walletsService } from "@/api/services/wallets";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/wallets/summary; balances move often, so it goes stale after a minute. */
export const walletSummaryQuery = createQueryStore(() => walletsService.summary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every transaction; searched, filtered and paged in the browser. */
export const walletTransactionsQuery = createQueryStore(() => walletsService.transactionsAll(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One transaction by reference or GUID. */
export const walletTransactionQuery = createQueryStore((id: string) => walletsService.transaction(id), {
  keyOf: (id) => id,
  staleTime: 60_000,
});

export const useWalletSummary = () => walletSummaryQuery.useQuery();
export const useWalletTransactions = () => walletTransactionsQuery.useQuery();
export const useWalletTransaction = (id: string) => walletTransactionQuery.useQuery(id);
