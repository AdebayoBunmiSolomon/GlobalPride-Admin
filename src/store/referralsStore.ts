import { referralsService } from "@/api/services/referrals";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/referrals/summary. */
export const referralSummaryQuery = createQueryStore(() => referralsService.summary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every referral; searched, filtered and paged in the browser. */
export const referralsQuery = createQueryStore(() => referralsService.listAll(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One referral by GUID. */
export const referralQuery = createQueryStore((id: string) => referralsService.referral(id), {
  keyOf: (id) => id,
  staleTime: 60_000,
});

export const useReferralSummary = () => referralSummaryQuery.useQuery();
export const useReferrals = () => referralsQuery.useQuery();
export const useReferral = (id: string) => referralQuery.useQuery(id);
