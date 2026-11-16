import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import { mutate } from "@/api/utils/mutate";
import { isRaw, key, list, nested, num, oneOf, pick, text, unwrapItem, type Raw } from "@/api/utils/raw";
import type { FlagDecisionPayload, FlagDismissPayload, FlagNotePayload } from "@/api/types/request";
import type {
  ActivityItem,
  AdminResponse,
  AuditLog,
  CampaignComplianceStatus,
  ComplianceFlag,
  ComplianceNote,
  ComplianceSummary,
  ContentReport,
  DisclaimerAcceptance,
  FlagAction,
  FlaggedCampaign,
  FlagSeverity,
  FlagSource,
  FlagStatus,
  LogPage,
  PagedResult,
  ReportReason,
} from "@/api/types/response";

// Swagger documents the request bodies and filter values but no response
// bodies for /admin/compliance, so rows are read defensively (see utils/raw).

const SOURCES: FlagSource[] = ["system", "campaign", "content_report", "account", "referral"];
const SEVERITIES: FlagSeverity[] = ["low", "medium", "high", "critical"];
const STATUSES: FlagStatus[] = ["pending_review", "under_review", "resolved", "dismissed"];
const ACTIONS: FlagAction[] = ["campaign_cancelled", "user_suspended", "user_restricted", "no_further_action"];
const REASONS: ReportReason[] = ["harassment", "spam_abuse", "fraud_deception", "privacy_concern", "prohibited_content", "other"];

/** "pending" / "open" → pending_review, "reviewing" → under_review, otherwise the matching status. */
const toFlagStatus = (value: unknown): FlagStatus => {
  const name = key(value);
  if (name === "pending" || name === "open" || name === "new") return "pending_review";
  if (name === "reviewing" || name === "inreview") return "under_review";
  return oneOf(STATUSES, value, "pending_review");
};

/** A person from flat fields (`userId`, `userName`) or a nested object (`user: { id, fullName }`). */
const person = (raw: Raw, prefix: string, ...objects: string[]) => {
  const inner = nested(raw, ...objects);
  return {
    id: text(raw, `${prefix}Id`) ?? text(inner, "id", "userId"),
    name:
      text(raw, `${prefix}Name`, `${prefix}FullName`) ??
      text(inner, "fullName", "name", "displayName", "email") ??
      text(raw, `${prefix}Email`) ??
      "Unknown user",
  };
};

const toNote = (raw: Raw, index: number): ComplianceNote => ({
  id: text(raw, "id", "noteId") ?? `n${index}`,
  authorName: text(raw, "authorName", "adminName", "createdByName", "createdBy", "author") ?? "Administrator",
  body: text(raw, "note", "body", "message", "text") ?? "",
  createdAt: text(raw, "createdAt", "at", "date") ?? "",
});

const toFlag = (raw: Raw): ComplianceFlag => {
  const id = text(raw, "id", "number", "flagId") ?? "";
  const user = person(raw, "user", "user", "flaggedUser");
  const campaign = nested(raw, "campaign");
  const source = oneOf(SOURCES, pick(raw, "source", "sourceType"), "system");
  const contentText = text(raw, "content", "contentText", "message", "messageText", "flaggedContent");
  const createdAt = text(raw, "createdAt", "flaggedAt", "dateCreated") ?? "";
  const action = pick(raw, "action", "actionTaken", "decisionAction");

  return {
    id,
    code: text(raw, "code", "reference", "flagCode") ?? id,
    userId: user.id,
    userName: user.name,
    activity: text(raw, "title", "activity", "summary") ?? text(raw, "reason") ?? "Flagged activity",
    reason: text(raw, "reason", "description") ?? "",
    source,
    severity: oneOf(SEVERITIES, pick(raw, "severity"), "medium"),
    status: toFlagStatus(pick(raw, "status")),
    createdAt,
    updatedAt: text(raw, "updatedAt", "lastUpdatedAt", "modifiedAt") ?? createdAt,
    content: contentText
      ? {
          label:
            text(raw, "contentLabel") ??
            (source === "content_report" ? "Reported Message" : source === "campaign" ? "Campaign Message" : "Content"),
          text: contentText,
        }
      : null,
    campaignId: text(raw, "campaignReference", "campaignId", "campaignCode") ?? text(campaign, "reference", "id"),
    campaignName: text(raw, "campaignTitle", "campaignName") ?? text(campaign, "title", "name"),
    reportId: text(raw, "reportCode", "reportId", "contentReportId") ?? text(nested(raw, "report"), "code", "id"),
    action: action == null || action === "" ? null : oneOf(ACTIONS, action, "no_further_action"),
    dismissedReason: text(raw, "dismissedReason", "dismissReason", "dismissalReason"),
    closedBy: text(raw, "closedByName", "closedBy", "reviewedByName", "reviewedBy", "resolvedBy", "dismissedBy"),
    closedAt: text(raw, "closedAt", "resolvedAt", "dismissedAt", "reviewedAt"),
    notes: list(raw, "notes", "reviewNotes").map(toNote),
  };
};

/** A flag mutation's `result` read as the updated flag, if it is one. */
const toFlagOrNull = (result: unknown) => {
  const raw = unwrapItem(result, "flag");
  return raw && pick(raw, "id", "code") != null && pick(raw, "status", "severity") != null ? toFlag(raw) : null;
};

const toSummary = (result: unknown): ComplianceSummary => {
  const raw = isRaw(result) ? { ...result, ...nested(result, "flags", "byStatus", "counts") } : {};
  return {
    total: num(raw, "total", "totalFlags", "all"),
    pendingReview: num(raw, "pendingReview", "pending_review", "pending"),
    underReview: num(raw, "underReview", "under_review"),
    resolved: num(raw, "resolved"),
    dismissed: num(raw, "dismissed"),
  };
};

const toReport = (raw: Raw): ContentReport => {
  const reporter = person(raw, "reporter", "reporter", "reportedBy");
  const reported = person(raw, "reportedUser", "reportedUser", "reported", "author");
  const flag = nested(raw, "flag");
  const reason = key(pick(raw, "reason", "category"));
  return {
    id: text(raw, "code", "reference", "id") ?? "",
    reporterId: reporter.id,
    reporterName: reporter.name,
    reportedUserId: reported.id,
    reportedUserName: reported.name,
    content: text(raw, "content", "messageText", "message", "reportedContent") ?? "",
    // The mobile app may send short names ("spam", "fraud").
    reason: REASONS.find((value) => key(value) === reason || key(value).startsWith(reason)) ?? "other",
    status: toFlagStatus(pick(raw, "status", "flagStatus") ?? pick(flag, "status")),
    createdAt: text(raw, "createdAt", "reportedAt") ?? "",
    flagId: text(raw, "flagCode", "flagId") ?? text(flag, "code", "id"),
  };
};

const CAMPAIGN_STATUSES: CampaignComplianceStatus[] = ["flagged", "under_review", "resolved"];

const toFlaggedCampaign = (raw: Raw): FlaggedCampaign => {
  const campaign = nested(raw, "campaign");
  const user = person(raw, "user", "user", "owner");
  const flagCount = num(raw, "flagCount", "totalFlags", "flags") ?? 0;
  const openFlagCount = num(raw, "openFlagCount", "openFlags", "unresolvedFlags") ?? 0;
  const underReview = num(raw, "underReviewCount", "underReviewFlags") ?? 0;
  const statusValue = pick(raw, "complianceStatus", "status");
  return {
    id: text(raw, "reference", "campaignReference", "campaignId", "id") ?? text(campaign, "reference", "id") ?? "",
    name: text(raw, "title", "name", "campaignTitle", "campaignName") ?? text(campaign, "title", "name") ?? "Untitled campaign",
    userId: user.id,
    userName: user.name,
    status:
      statusValue != null
        ? oneOf(CAMPAIGN_STATUSES, statusValue, openFlagCount > 0 ? "flagged" : "resolved")
        : openFlagCount === 0
          ? "resolved"
          : underReview >= openFlagCount
            ? "under_review"
            : "flagged",
    flagCount,
    openFlagCount,
    lastFlaggedAt: text(raw, "lastFlaggedAt", "flaggedAt"),
    lastReviewedAt: text(raw, "lastReviewedAt", "reviewedAt"),
  };
};

const toAuditLog = (raw: Raw, index: number): AuditLog => ({
  id: text(raw, "id") ?? `a${index}`,
  at: text(raw, "at", "createdAt", "timestamp", "date") ?? "",
  adminName: text(raw, "adminName", "admin", "performedBy", "actorName", "userName") ?? "Administrator",
  action: text(raw, "action", "actionName", "event") ?? "",
  recordId: text(raw, "record", "recordId", "recordReference", "entityId", "target"),
  details: text(raw, "details", "description", "message") ?? "",
});

const toAcceptance = (raw: Raw, index: number): DisclaimerAcceptance => {
  const user = person(raw, "user", "user");
  return {
    id: text(raw, "id") ?? `d${index}`,
    userId: user.id,
    userName: user.name,
    version: text(raw, "version", "disclaimerVersion"),
    acceptedAt: text(raw, "acceptedAt", "createdAt", "at") ?? "",
    campaignId: text(raw, "campaignReference", "campaignId") ?? text(nested(raw, "campaign"), "reference", "id"),
    ip: text(raw, "ip", "ipAddress"),
    device: text(raw, "device", "userAgent", "deviceInfo"),
  };
};

const toActivity = (raw: Raw, index: number): ActivityItem & { userId: string | null } => {
  const user = person(raw, "user", "user");
  return {
    id: text(raw, "id") ?? `act${index}`,
    type: text(raw, "type", "activityType") ?? "",
    title: text(raw, "title") ?? "",
    description: text(raw, "description", "message") ?? "",
    createdAt: text(raw, "createdAt", "at") ?? "",
    userName: user.name,
    userId: user.id,
  };
};

const flagPath = (id: string) => `/admin/compliance/flags/${encodeURIComponent(id)}`;

const fetchAll = async (path: string, params: Record<string, unknown>, fallbackMessage: string) => {
  const pages = await fetchAllPages(async (page) => {
    const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>(path, {
      params: { ...params, page, pageSize: MAX_PAGE_SIZE },
      useAuth: true,
    });
    return unwrap(data, fallbackMessage);
  });
  return pages.flatMap((page) => page.items).filter(isRaw);
};

/** Filters for the server-paged logs; empty values are left out. */
export interface LogQuery {
  search?: string;
  /** Audit logs: action name. Activity logs: activity type name. */
  filter?: string;
  /** yyyy-MM-dd. */
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

const fetchLogPage = async <T,>(
  path: string,
  filterName: "action" | "type" | null,
  { search, filter, from, to, page, pageSize }: LogQuery,
  read: (raw: Raw, index: number) => T,
  fallbackMessage: string,
): Promise<LogPage<T>> => {
  const params: Record<string, unknown> = { page, pageSize };
  if (search?.trim()) params.search = search.trim();
  if (filterName && filter) params[filterName] = filter;
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>(path, { params, useAuth: true });
  const result = unwrap(data, fallbackMessage);
  return {
    items: (result.items ?? []).filter(isRaw).map(read),
    totalCount: result.totalCount ?? 0,
    totalPages: result.totalPages ?? 0,
  };
};

/** Admin Compliance (`/admin/compliance`). Every call rejects with a normalized `ApiError`. */
export const complianceService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/compliance/summary", { useAuth: true });
    return toSummary(unwrap(data, "We couldn't load the compliance summary."));
  },

  /** Every flag (all pages). Search, filters and paging are done in the browser. */
  listFlags: async (): Promise<ComplianceFlag[]> =>
    (await fetchAll("/admin/compliance/flags", {}, "We couldn't load flagged activities.")).map(toFlag),

  /** `id` is the number (12) or the code (FLG-0012). */
  flag: async (id: string): Promise<ComplianceFlag> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(flagPath(id), { useAuth: true });
    return toFlag(unwrapItem(unwrap(data, "We couldn't load this flag."), "flag") ?? {});
  },

  /** Pending review → under review. */
  startReview: async (id: string) => {
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${flagPath(id)}/start-review`, null, { useAuth: true }),
      "We couldn't start the review.",
    );
    return { flag: toFlagOrNull(result), message };
  },

  /** Confirms a violation and takes the action (the API suspends / restricts the user or cancels the campaign). */
  decide: async (id: string, action: FlagAction) => {
    const payload: FlagDecisionPayload = { action };
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${flagPath(id)}/decision`, payload, { useAuth: true }),
      "We couldn't record this decision.",
    );
    return { flag: toFlagOrNull(result), message };
  },

  /** No violation found: closes the flag. */
  dismiss: async (id: string, reason: string) => {
    const payload: FlagDismissPayload = { reason };
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${flagPath(id)}/dismiss`, payload, { useAuth: true }),
      "We couldn't dismiss this flag.",
    );
    return { flag: toFlagOrNull(result), message };
  },

  addNote: async (id: string, note: string) => {
    const payload: FlagNotePayload = { note };
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${flagPath(id)}/notes`, payload, { useAuth: true }),
      "We couldn't add this note.",
    );
    return { flag: toFlagOrNull(result), message };
  },

  /** Every content report (all pages). */
  listReports: async (): Promise<ContentReport[]> =>
    (await fetchAll("/admin/compliance/content-reports", {}, "We couldn't load content reports.")).map(toReport),

  /** Every campaign that has been flagged at least once (all pages). */
  listFlaggedCampaigns: async (): Promise<FlaggedCampaign[]> =>
    (await fetchAll("/admin/compliance/campaigns", {}, "We couldn't load campaign compliance.")).map(toFlaggedCampaign),

  auditLogs: (query: LogQuery) =>
    fetchLogPage("/admin/compliance/audit-logs", "action", query, toAuditLog, "We couldn't load the audit logs."),

  disclaimerLogs: (query: LogQuery) =>
    fetchLogPage("/admin/compliance/disclaimer-logs", null, query, toAcceptance, "We couldn't load the disclaimer logs."),

  activityLogs: (query: LogQuery) =>
    fetchLogPage("/admin/compliance/activity-logs", "type", query, toActivity, "We couldn't load the activity logs."),
};
