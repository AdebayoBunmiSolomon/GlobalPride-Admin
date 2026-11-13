export type FlagSource = "system" | "campaign" | "content_report";

export type FlagSeverity = "low" | "medium" | "high" | "critical";

/** pending_review → under_review → resolved (violation confirmed) or dismissed (no violation). */
export type FlagStatus = "pending_review" | "under_review" | "resolved" | "dismissed";

/** Enforcement recorded when a violation is confirmed. */
export type FlagAction = "campaign_cancelled" | "user_suspended" | "user_restricted" | "no_further_action";

export interface ComplianceNote {
  id: string;
  authorName: string;
  body: string;
  /** ISO date-time. */
  createdAt: string;
}

export interface ComplianceFlag {
  /** e.g. "FLG-0018". */
  id: string;
  userId: string;
  userName: string;
  /** Short description of what was flagged, e.g. "Reported spam activity". */
  activity: string;
  reason: string;
  source: FlagSource;
  severity: FlagSeverity;
  status: FlagStatus;
  /** ISO date-time. */
  createdAt: string;
  /** ISO date-time. */
  updatedAt: string;
  /** The message that triggered the flag, when captured. */
  content?: { label: string; text: string };
  campaignId?: string;
  /** Content report that raised this flag. */
  reportId?: string;
  /** Resolved flags only. */
  action?: FlagAction;
  /** Dismissed flags only. */
  dismissedReason?: string;
  /** Who resolved or dismissed it, and when (ISO date-time). */
  closedBy?: string;
  closedAt?: string;
  notes: ComplianceNote[];
}

export type ReportReason = "harassment" | "spam" | "fraud" | "privacy" | "prohibited" | "other";

/** A user's report about another user's message. Its status comes from the flag it raised. */
export interface ContentReport {
  /** e.g. "RPT-0008". */
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  content: string;
  reason: ReportReason;
  /** ISO date-time. */
  createdAt: string;
  flagId: string;
}

export type ActivityLogSource = "campaign" | "content_report" | "account";

export interface UserActivityLog {
  id: string;
  /** ISO date-time. */
  at: string;
  userId: string;
  userName: string;
  activity: string;
  source: ActivityLogSource;
  result: string;
  flagId: string;
}

export interface AuditLog {
  id: string;
  /** ISO date-time. */
  at: string;
  adminName: string;
  action: string;
  /** Flag the action was taken on. */
  recordId: string;
  details: string;
}

export interface DisclaimerAcceptance {
  id: string;
  userId: string;
  userName: string;
  /** e.g. "v1.3". */
  version: string;
  /** ISO date-time. */
  acceptedAt: string;
  /** Absent when not captured. */
  ip?: string;
  device?: string;
}
