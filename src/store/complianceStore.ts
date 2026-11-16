import { complianceService, type LogQuery } from "@/api/services/compliance";
import type { ComplianceFlag, FlagAction } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";
import { campaignDetailsQuery, campaignListQuery } from "./campaignsStore";
import { dashboardQuery } from "./dashboardStore";
import { userDetailsQuery, userListQuery } from "./usersStore";

export const complianceSummaryQuery = createQueryStore(() => complianceService.summary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every flag; searched, filtered and paged in the browser. */
export const flagsQuery = createQueryStore(() => complianceService.listFlags(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One flag by code (FLG-0012) or number, as it appears in the URL. */
export const flagQuery = createQueryStore((id: string) => complianceService.flag(id), {
  keyOf: (id) => id,
  staleTime: 30_000,
});

export const contentReportsQuery = createQueryStore(() => complianceService.listReports(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

export const flaggedCampaignsQuery = createQueryStore(() => complianceService.listFlaggedCampaigns(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

// The logs can be long, so they are paged and filtered by the API (one cache entry per query).
export const auditLogsQuery = createQueryStore((query: LogQuery) => complianceService.auditLogs(query), {
  staleTime: 30_000,
});
export const disclaimerLogsQuery = createQueryStore((query: LogQuery) => complianceService.disclaimerLogs(query), {
  staleTime: 60_000,
});
export const activityLogsQuery = createQueryStore((query: LogQuery) => complianceService.activityLogs(query), {
  staleTime: 30_000,
});

export const useComplianceSummary = () => complianceSummaryQuery.useQuery();
export const useFlags = () => flagsQuery.useQuery();
export const useFlag = (id: string) => flagQuery.useQuery(id);
export const useContentReports = () => contentReportsQuery.useQuery();
export const useFlaggedCampaigns = () => flaggedCampaignsQuery.useQuery();
export const useAuditLogs = (query: LogQuery) => auditLogsQuery.useQuery(query);
export const useDisclaimerLogs = (query: LogQuery) => disclaimerLogsQuery.useQuery(query);
export const useActivityLogs = (query: LogQuery) => activityLogsQuery.useQuery(query);

/**
 * Puts a flag's new state in the caches, and marks everything a review can
 * change as stale: the summary, reports (their status is the flag's),
 * campaign compliance and the audit log.
 */
const applyFlag = (flag: ComplianceFlag) => {
  flagsQuery.setData([], (flags) =>
    flags.map((cached) => (cached.id === flag.id ? { ...flag, notes: flag.notes.length ? flag.notes : cached.notes } : cached)),
  );
  flagQuery.setAllData((cached) => (cached.id === flag.id ? flag : cached));
  complianceSummaryQuery.invalidate();
  contentReportsQuery.invalidate();
  flaggedCampaignsQuery.invalidate();
  auditLogsQuery.invalidate();
};

/**
 * Applies a flag mutation's result. Responses aren't documented, so when one
 * carries no flag the change is applied locally and the flag refetched.
 */
const afterChange = (
  flag: ComplianceFlag,
  result: { flag: ComplianceFlag | null },
  local: (flag: ComplianceFlag, now: string) => Partial<ComplianceFlag>,
) => {
  if (result.flag) {
    applyFlag(result.flag);
    return;
  }
  const now = new Date().toISOString();
  applyFlag({ ...flag, ...local(flag, now), updatedAt: now });
  flagsQuery.invalidate();
  flagQuery.invalidate();
  void flagQuery.fetch([flag.code], { force: true });
};

export const startFlagReview = async (flag: ComplianceFlag) => {
  const result = await complianceService.startReview(flag.code);
  afterChange(flag, result, () => ({ status: "under_review" }));
  return result;
};

/**
 * Confirms a violation. The API also applies the action (suspends or
 * restricts the user, or cancels the campaign), so those caches are marked
 * stale. `adminName` is shown until the server's version arrives.
 */
export const confirmFlagViolation = async (flag: ComplianceFlag, action: FlagAction, adminName: string) => {
  const result = await complianceService.decide(flag.code, action);
  afterChange(flag, result, (_, now) => ({ status: "resolved", action, closedBy: adminName, closedAt: now }));
  if (action === "user_suspended" || action === "user_restricted") {
    userListQuery.invalidate();
    userDetailsQuery.invalidate();
  }
  if (action === "campaign_cancelled") {
    campaignListQuery.invalidate();
    campaignDetailsQuery.invalidate();
  }
  dashboardQuery.invalidate();
  return result;
};

export const dismissFlag = async (flag: ComplianceFlag, reason: string, adminName: string) => {
  const result = await complianceService.dismiss(flag.code, reason);
  afterChange(flag, result, (_, now) => ({ status: "dismissed", dismissedReason: reason, closedBy: adminName, closedAt: now }));
  return result;
};

export const addFlagNote = async (flag: ComplianceFlag, note: string, adminName: string) => {
  const result = await complianceService.addNote(flag.code, note);
  afterChange(flag, result, (current, now) => ({
    notes: [...current.notes, { id: `local-${Date.now()}`, authorName: adminName, body: note, createdAt: now }],
  }));
  return result;
};
