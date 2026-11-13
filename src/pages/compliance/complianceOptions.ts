import { Cpu, Flag, Megaphone, UserCog, type LucideIcon } from "lucide-react";

import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { Campaign } from "@/types/campaign";
import type {
  ActivityLogSource,
  ComplianceFlag,
  FlagSeverity,
  FlagSource,
  FlagStatus,
  ReportReason,
} from "@/types/compliance";

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
};

export const reportReasonLabels: Record<ReportReason, string> = {
  harassment: "Harassment",
  spam: "Spam/Abuse",
  fraud: "Fraud/Deception",
  privacy: "Privacy Concern",
  prohibited: "Prohibited Content",
  other: "Other",
};

export const activitySources: Record<ActivityLogSource, { label: string; icon: LucideIcon }> = {
  campaign: { label: "Campaign", icon: Megaphone },
  content_report: { label: "Content Report", icon: Flag },
  account: { label: "Account", icon: UserCog },
};

const toOptions = (entries: [string, { label: string } | string][]) =>
  entries.map(([value, entry]) => ({ value, label: typeof entry === "string" ? entry : entry.label }));

export const flagStatusFilterOptions = [{ label: "All Statuses", value: "all" }, ...toOptions(Object.entries(flagStatusStyles))];
export const flagSeverityFilterOptions = [
  { label: "All Severities", value: "all" },
  ...toOptions(Object.entries(flagSeverityStyles)),
];
export const flagSourceFilterOptions = [{ label: "All Sources", value: "all" }, ...toOptions(Object.entries(flagSources))];
export const reportReasonFilterOptions = [
  { label: "All Reasons", value: "all" },
  ...toOptions(Object.entries(reportReasonLabels)),
];
export const activitySourceFilterOptions = [
  { label: "All Sources", value: "all" },
  ...toOptions(Object.entries(activitySources)),
];

/** A flag that still needs a decision. */
export const isOpenFlag = (flag: ComplianceFlag) => flag.status === "pending_review" || flag.status === "under_review";

// ---- Campaign compliance ----

export type CampaignComplianceStatus = "flagged" | "under_review" | "resolved" | "clear";

export const campaignComplianceStyles: Record<CampaignComplianceStatus, BadgeStyle> = {
  flagged: { label: "Flagged", variant: "warning", className: "text-amber-700" },
  under_review: { label: "Under Review", variant: "info", className: "text-blue-700" },
  resolved: { label: "Resolved", variant: "primary" },
  clear: { label: "Clear", variant: "success", className: "text-green-700" },
};

export const campaignComplianceFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...toOptions(Object.entries(campaignComplianceStyles)),
];

/** Sort order: campaigns needing attention first. */
export const campaignComplianceRank: Record<CampaignComplianceStatus, number> = {
  flagged: 0,
  under_review: 1,
  resolved: 2,
  clear: 3,
};

/**
 * A campaign's compliance status from its flags: Flagged while any flag is
 * waiting for review, Under Review while one is being reviewed, Resolved once
 * every flag is closed, Clear when it was never flagged.
 */
export const getCampaignCompliance = (campaign: Campaign, flags: ComplianceFlag[]) => {
  const campaignFlags = flags.filter((flag) => flag.campaignId === campaign.id);
  const status: CampaignComplianceStatus = campaignFlags.some((flag) => flag.status === "pending_review")
    ? "flagged"
    : campaignFlags.some((flag) => flag.status === "under_review")
      ? "under_review"
      : campaignFlags.length > 0
        ? "resolved"
        : "clear";
  const lastReviewed = campaignFlags.map((flag) => flag.updatedAt).sort().at(-1);
  return { status, flagCount: campaignFlags.length, lastReviewed };
};
