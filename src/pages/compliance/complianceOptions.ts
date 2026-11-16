import { Cpu, Flag, Gift, Megaphone, UserCog, type LucideIcon } from "lucide-react";

import type {
  CampaignComplianceStatus,
  ComplianceFlag,
  FlagAction,
  FlagSeverity,
  FlagSource,
  FlagStatus,
  ReportReason,
} from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

export const backToCompliance = { label: "Back to Compliance", to: "/compliance" };

export const flagStatusStyles: Record<FlagStatus, BadgeStyle> = {
  pending_review: { label: "Pending Review", variant: "primary" },
  under_review: { label: "Under Review", variant: "info", className: "text-blue-700" },
  resolved: { label: "Resolved", variant: "success", className: "text-green-700" },
  dismissed: { label: "Dismissed", variant: "neutral" },
};

export const flagSeverityStyles: Record<FlagSeverity, BadgeStyle> = {
  low: { label: "Low", variant: "neutral" },
  medium: { label: "Medium", variant: "warning", className: "text-amber-700" },
  high: { label: "High", variant: "warning", className: "text-orange-700" },
  critical: { label: "Critical", variant: "danger", className: "text-red-600" },
};

export const flagSources: Record<FlagSource, { label: string; icon: LucideIcon }> = {
  system: { label: "System", icon: Cpu },
  campaign: { label: "Campaign", icon: Megaphone },
  content_report: { label: "Content Report", icon: Flag },
  account: { label: "Account", icon: UserCog },
  referral: { label: "Referral", icon: Gift },
};

/** Labels for enforcement actions, shared by the review UI and the outcome. */
export const flagActionLabels: Record<FlagAction, string> = {
  campaign_cancelled: "Campaign Cancelled",
  user_suspended: "User Suspended",
  user_restricted: "User Restricted",
  no_further_action: "No Further Action",
};

export const reportReasonLabels: Record<ReportReason, string> = {
  harassment: "Harassment",
  spam_abuse: "Spam/Abuse",
  fraud_deception: "Fraud/Deception",
  privacy_concern: "Privacy Concern",
  prohibited_content: "Prohibited Content",
  other: "Other",
};

const toOptions = (entries: [string, { label: string } | string][]) =>
  entries.map(([value, entry]) => ({ value, label: typeof entry === "string" ? entry : entry.label }));

export const flagStatusFilterOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Open (pending + under review)", value: "open" },
  ...toOptions(Object.entries(flagStatusStyles)),
];
export const flagSeverityFilterOptions = [
  { label: "All Severities", value: "all" },
  ...toOptions(Object.entries(flagSeverityStyles)),
];
export const flagSourceFilterOptions = [{ label: "All Sources", value: "all" }, ...toOptions(Object.entries(flagSources))];
export const reportStatusFilterOptions = [{ label: "All Statuses", value: "all" }, ...toOptions(Object.entries(flagStatusStyles))];
export const reportReasonFilterOptions = [
  { label: "All Reasons", value: "all" },
  ...toOptions(Object.entries(reportReasonLabels)),
];

/** A flag that still needs a decision. */
export const isOpenFlag = (flag: Pick<ComplianceFlag, "status">) =>
  flag.status === "pending_review" || flag.status === "under_review";

/** Matches the `?status=` filter, where "open" means pending or under review. */
export const matchesFlagStatus = (flag: Pick<ComplianceFlag, "status">, status: string) =>
  status === "all" || (status === "open" ? isOpenFlag(flag) : flag.status === status);

// ---- Campaign compliance ----

export const campaignComplianceStyles: Record<CampaignComplianceStatus, BadgeStyle> = {
  flagged: { label: "Flagged", variant: "warning", className: "text-amber-700" },
  under_review: { label: "Under Review", variant: "info", className: "text-blue-700" },
  resolved: { label: "Resolved", variant: "primary" },
};

export const campaignComplianceFilterOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Open (unresolved flag)", value: "open" },
  ...toOptions(Object.entries(campaignComplianceStyles)),
];

/** Sort order: campaigns needing attention first. */
export const campaignComplianceRank: Record<CampaignComplianceStatus, number> = {
  flagged: 0,
  under_review: 1,
  resolved: 2,
};

/** Link for an audit log record: flags, campaigns, announcements, ads and tickets have pages. */
export const recordLink = (record: string | null) => {
  if (!record) return null;
  const encoded = encodeURIComponent(record);
  if (/^FLG-/i.test(record)) return `/compliance/flags/${encoded}`;
  if (/^GP-\d/i.test(record)) return `/campaigns/${encoded}`;
  if (/^NOT-/i.test(record)) return `/notifications/${encoded}`;
  if (/^AD-/i.test(record)) return `/advertisements/${encoded}`;
  if (/^TKT-/i.test(record)) return `/support/tickets/${encoded}`;
  if (/^GP-TRX-/i.test(record)) return `/wallets/transactions/${encoded}`;
  return null;
};
