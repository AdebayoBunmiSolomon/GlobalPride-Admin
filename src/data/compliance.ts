// Placeholder compliance data (flags, reports, logs) until the compliance API exists.
import type {
  AuditLog,
  ComplianceFlag,
  ContentReport,
  DisclaimerAcceptance,
  UserActivityLog,
} from "@/types/compliance";
import { mockUsers } from "./mock";

/** Display name for compliance reviewers until the signed-in admin's profile is available. */
export const COMPLIANCE_ADMIN = "Compliance Admin";

const userName = (userId: string) => mockUsers.find((user) => user.id === userId)?.name ?? "Unknown user";

type FlagSeed = Omit<ComplianceFlag, "userName" | "notes" | "updatedAt" | "closedBy"> & {
  updatedAt?: string;
  notes?: [string, string][];
};

const flagSeeds: FlagSeed[] = [
  { id: "FLG-0018", userId: "u-1004", activity: "Bulk duplicate broadcast detected", reason: "Repeat broadcast of identical promotional content within a short window.", source: "system", severity: "medium", status: "resolved", createdAt: "2026-10-05T16:40:00", campaignId: "GP-2026-00314", content: { label: "Campaign Message", text: "MEGA SALE!! Buy now buy now!! Limited slots, send money to reserve your order today." }, action: "campaign_cancelled", closedAt: "2026-10-06T18:16:00" },
  { id: "FLG-0017", userId: "u-1003", activity: "Potentially prohibited campaign content", reason: "Potentially prohibited content detected in SMS copy.", source: "campaign", severity: "critical", status: "under_review", createdAt: "2026-10-05T14:12:00", updatedAt: "2026-10-06T18:17:00", campaignId: "GP-2026-00309", content: { label: "Campaign Message", text: "Congratulations! You have won a guaranteed prize. Send your bank details now to claim your reward." } },
  { id: "FLG-0016", userId: "u-1012", activity: "Reported message content", reason: "Reported by a user for potentially harassing message content.", source: "content_report", severity: "high", status: "under_review", createdAt: "2026-10-05T11:00:00", reportId: "RPT-0008", content: { label: "Reported Message", text: "If you do not pay today we will keep messaging everyone on your contact list until you settle." }, notes: [["Reviewing the message against the platform content guidelines. Awaiting the reported user's prior message history.", "2026-10-05T13:20:00"]] },
  { id: "FLG-0015", userId: "u-1008", activity: "Unusual bulk list activity", reason: "Campaign content requires manual review before delivery.", source: "campaign", severity: "high", status: "under_review", createdAt: "2026-10-04T18:30:00", campaignId: "GP-2026-00288", content: { label: "Campaign Message", text: "Holiday greetings from us! Forward this to 10 friends to unlock a ₦5,000 gift." }, notes: [["Requested a fuller review of the campaign content.", "2026-10-05T09:45:00"]] },
  { id: "FLG-0014", userId: "u-1010", activity: "Reported spam activity", reason: "Reported for repeated unsolicited messages.", source: "content_report", severity: "medium", status: "pending_review", createdAt: "2026-10-04T15:20:00", updatedAt: "2026-10-04T15:22:00", reportId: "RPT-0007", content: { label: "Reported Message", text: "Selling verified contact lists. Cheapest rates in the country. Message me for pricing." } },
  { id: "FLG-0013", userId: "u-1010", activity: "Reported fraudulent conduct", reason: "Reported for suspected fraud or deception.", source: "content_report", severity: "high", status: "resolved", createdAt: "2026-10-03T12:40:00", reportId: "RPT-0006", content: { label: "Reported Message", text: "Send a small verification fee to unlock your reward. Offer expires in one hour." }, action: "user_restricted", closedAt: "2026-10-04T10:15:00" },
  { id: "FLG-0012", userId: "u-1003", activity: "Prohibited campaign content detected", reason: "Potentially prohibited content detected in SMS copy.", source: "campaign", severity: "critical", status: "resolved", createdAt: "2026-10-03T15:30:00", campaignId: "GP-2026-00309", content: { label: "Campaign Message", text: "Win big! Send ₦2,000 now to enter our guaranteed prize draw." }, action: "campaign_cancelled", closedAt: "2026-10-03T16:40:00" },
  { id: "FLG-0011", userId: "u-1008", activity: "Account security event", reason: "Relevant account/security event flagged for review.", source: "system", severity: "medium", status: "resolved", createdAt: "2026-10-02T20:05:00", action: "no_further_action", closedAt: "2026-10-03T09:00:00" },
  { id: "FLG-0010", userId: "u-1007", activity: "Reported content", reason: "Reported by a user for potentially prohibited content.", source: "content_report", severity: "low", status: "dismissed", createdAt: "2026-10-02T13:10:00", reportId: "RPT-0005", content: { label: "Reported Message", text: "Last chance to grab your discount codes before the weekend ends." }, dismissedReason: "The message is a standard promotional reminder and does not breach any platform content guideline.", closedAt: "2026-10-02T15:30:00" },
  { id: "FLG-0009", userId: "u-1012", activity: "Reported spam content", reason: "Reported for repeated unsolicited messages.", source: "content_report", severity: "medium", status: "under_review", createdAt: "2026-10-01T17:40:00", updatedAt: "2026-10-02T09:10:00", reportId: "RPT-0004", content: { label: "Reported Message", text: "You have been selected for a free giveaway! Reply with your BVN to claim your prize." } },
  { id: "FLG-0008", userId: "u-1006", activity: "Campaign link mismatch", reason: "Campaign link points to a different domain than the sender's business.", source: "campaign", severity: "low", status: "dismissed", createdAt: "2026-09-30T15:00:00", campaignId: "GP-2026-00298", content: { label: "Campaign Message", text: "Flash discount! 40% off everything today only. Shop now: shop.chiomaeze-store.ng" }, dismissedReason: "The link redirects to the sender's verified store domain.", closedAt: "2026-09-30T18:15:00" },
  { id: "FLG-0007", userId: "u-1001", activity: "Personal data shared in message", reason: "Reported for sharing personal contact data without consent.", source: "content_report", severity: "high", status: "resolved", createdAt: "2026-09-29T10:20:00", reportId: "RPT-0003", content: { label: "Reported Message", text: "Here is the full contact list you requested, with phone numbers and home addresses." }, action: "user_restricted", closedAt: "2026-09-29T16:05:00" },
  { id: "FLG-0006", userId: "u-1006", activity: "Prohibited keywords in campaign", reason: "Campaign copy contains restricted financial promotion keywords.", source: "campaign", severity: "medium", status: "resolved", createdAt: "2026-09-29T08:40:00", campaignId: "GP-2026-00298", content: { label: "Campaign Message", text: "Guaranteed 50% returns on your investment in 7 days. Limited slots." }, action: "no_further_action", closedAt: "2026-09-30T18:15:00" },
  { id: "FLG-0005", userId: "u-1009", activity: "Reported phishing link", reason: "Reported for a suspected phishing link.", source: "content_report", severity: "critical", status: "resolved", createdAt: "2026-09-27T09:30:00", reportId: "RPT-0002", content: { label: "Reported Message", text: "Click here to confirm your account and avoid suspension: bit.ly/gp-verify-now" }, action: "user_suspended", closedAt: "2026-09-27T14:50:00" },
  { id: "FLG-0004", userId: "u-1011", activity: "Referral abuse pattern", reason: "Multiple referral sign-ups from the same device.", source: "system", severity: "high", status: "resolved", createdAt: "2026-09-26T11:15:00", action: "user_restricted", closedAt: "2026-09-26T17:30:00" },
  { id: "FLG-0003", userId: "u-1002", activity: "Reported message", reason: "Reported for potentially prohibited content.", source: "content_report", severity: "low", status: "pending_review", createdAt: "2026-09-24T19:05:00", reportId: "RPT-0001", content: { label: "Reported Message", text: "Hey, we met last week. Just checking if you got my earlier messages about the investment plan." } },
  { id: "FLG-0002", userId: "u-1003", activity: "Unverified recipient list", reason: "Recipient list contains unverified contacts.", source: "campaign", severity: "medium", status: "pending_review", createdAt: "2026-09-08T09:20:00", campaignId: "GP-2026-00309" },
  { id: "FLG-0001", userId: "u-1012", activity: "Unusual login location", reason: "Sign-in from a new country shortly after a password change.", source: "system", severity: "low", status: "resolved", createdAt: "2026-09-05T07:45:00", action: "no_further_action", closedAt: "2026-09-05T11:00:00" },
];

export const mockComplianceFlags: ComplianceFlag[] = flagSeeds.map(({ notes = [], ...flag }) => {
  const flagNotes = notes.map(([body, createdAt], index) => ({
    id: `${flag.id}-n${index}`,
    authorName: COMPLIANCE_ADMIN,
    body,
    createdAt,
  }));
  const times = [flag.createdAt, flag.updatedAt, flag.closedAt, ...flagNotes.map((note) => note.createdAt)].filter(
    (value): value is string => Boolean(value),
  );
  return {
    ...flag,
    userName: userName(flag.userId),
    notes: flagNotes,
    closedBy: flag.closedAt ? COMPLIANCE_ADMIN : undefined,
    updatedAt: times.sort()[times.length - 1],
  };
});

const reportSeeds: Omit<ContentReport, "reporterName" | "reportedUserName" | "content">[] = [
  { id: "RPT-0008", reporterId: "u-1002", reportedUserId: "u-1012", reason: "harassment", createdAt: "2026-10-05T10:58:00", flagId: "FLG-0016" },
  { id: "RPT-0007", reporterId: "u-1007", reportedUserId: "u-1010", reason: "spam", createdAt: "2026-10-04T15:18:00", flagId: "FLG-0014" },
  { id: "RPT-0006", reporterId: "u-1001", reportedUserId: "u-1010", reason: "fraud", createdAt: "2026-10-03T12:38:00", flagId: "FLG-0013" },
  { id: "RPT-0005", reporterId: "u-1006", reportedUserId: "u-1007", reason: "other", createdAt: "2026-10-02T13:08:00", flagId: "FLG-0010" },
  { id: "RPT-0004", reporterId: "u-1005", reportedUserId: "u-1012", reason: "spam", createdAt: "2026-10-01T17:38:00", flagId: "FLG-0009" },
  { id: "RPT-0003", reporterId: "u-1011", reportedUserId: "u-1001", reason: "privacy", createdAt: "2026-09-29T10:18:00", flagId: "FLG-0007" },
  { id: "RPT-0002", reporterId: "u-1004", reportedUserId: "u-1009", reason: "fraud", createdAt: "2026-09-27T09:28:00", flagId: "FLG-0005" },
  { id: "RPT-0001", reporterId: "u-1008", reportedUserId: "u-1002", reason: "prohibited", createdAt: "2026-09-24T19:03:00", flagId: "FLG-0003" },
];

export const mockContentReports: ContentReport[] = reportSeeds.map((report) => ({
  ...report,
  reporterName: userName(report.reporterId),
  reportedUserName: userName(report.reportedUserId),
  content: mockComplianceFlags.find((flag) => flag.id === report.flagId)?.content?.text ?? "",
}));

const activitySeeds: [at: string, userId: string, activity: string, source: UserActivityLog["source"], result: string, flagId: string][] = [
  ["2026-10-05T16:40:00", "u-1004", "Campaign submitted", "campaign", "Flagged for review", "FLG-0018"],
  ["2026-10-05T14:12:00", "u-1003", "Campaign created", "campaign", "Flagged for review", "FLG-0017"],
  ["2026-10-05T11:00:00", "u-1012", "Content reported", "content_report", "Under review", "FLG-0016"],
  ["2026-10-04T18:30:00", "u-1008", "Campaign submitted", "campaign", "Held for review", "FLG-0015"],
  ["2026-10-04T15:20:00", "u-1010", "Content reported", "content_report", "Flagged for review", "FLG-0014"],
  ["2026-10-03T16:40:00", "u-1003", "Campaign cancelled", "campaign", "Cancelled by compliance", "FLG-0012"],
  ["2026-10-03T12:40:00", "u-1010", "Account restricted", "account", "Restriction applied", "FLG-0013"],
  ["2026-10-02T20:05:00", "u-1008", "Account security event", "account", "Reviewed", "FLG-0011"],
  ["2026-10-02T13:10:00", "u-1007", "Content reported", "content_report", "Reviewed", "FLG-0010"],
  ["2026-10-01T17:40:00", "u-1012", "Content reported", "content_report", "Under review", "FLG-0009"],
  ["2026-09-30T15:00:00", "u-1006", "Campaign submitted", "campaign", "Reviewed", "FLG-0008"],
  ["2026-09-29T16:05:00", "u-1001", "Account restricted", "account", "Restriction applied", "FLG-0007"],
  ["2026-09-29T10:20:00", "u-1001", "Content reported", "content_report", "Flagged for review", "FLG-0007"],
  ["2026-09-29T08:40:00", "u-1006", "Campaign submitted", "campaign", "Flagged for review", "FLG-0006"],
  ["2026-09-27T14:50:00", "u-1009", "Account suspended", "account", "Suspension applied", "FLG-0005"],
  ["2026-09-27T09:30:00", "u-1009", "Content reported", "content_report", "Flagged for review", "FLG-0005"],
  ["2026-09-26T11:15:00", "u-1011", "Referral sign-ups", "account", "Flagged for review", "FLG-0004"],
  ["2026-09-24T19:05:00", "u-1002", "Content reported", "content_report", "Flagged for review", "FLG-0003"],
  ["2026-09-08T09:20:00", "u-1003", "Campaign created", "campaign", "Flagged for review", "FLG-0002"],
];

export const mockUserActivityLogs: UserActivityLog[] = activitySeeds.map(
  ([at, userId, activity, source, result, flagId], index) => ({
    id: `UAL-${String(activitySeeds.length - index).padStart(4, "0")}`,
    at,
    userId,
    userName: userName(userId),
    activity,
    source,
    result,
    flagId,
  }),
);

const auditSeeds: [at: string, action: string, recordId: string, details: string][] = [
  ["2026-10-06T20:41:00", "Review started", "FLG-0014", "Flag moved to Under Review."],
  ["2026-10-06T18:17:00", "Review started", "FLG-0017", "Flag moved to Under Review."],
  ["2026-10-06T18:16:30", "Campaign cancelled", "FLG-0018", "Campaign GP-2026-00314 cancelled and further delivery stopped."],
  ["2026-10-06T18:16:00", "Violation confirmed", "FLG-0018", "Violation confirmed. Campaign Cancelled applied."],
  ["2026-10-06T18:15:00", "Review started", "FLG-0018", "Flag moved to Under Review."],
  ["2026-10-05T13:20:00", "Review started", "FLG-0016", "Flag moved to Under Review."],
  ["2026-10-05T09:45:00", "Compliance note added", "FLG-0015", "Requested a fuller review of the campaign content."],
  ["2026-10-05T09:30:00", "Review started", "FLG-0015", "Flag moved to Under Review."],
  ["2026-10-04T10:15:30", "User restricted", "FLG-0013", "Account activity restricted pending further review."],
  ["2026-10-04T10:15:00", "Violation confirmed", "FLG-0013", "Confirmed fraud pattern; user restricted."],
  ["2026-10-04T09:40:00", "Review started", "FLG-0013", "Flag moved to Under Review."],
  ["2026-10-03T16:40:30", "Campaign cancelled", "FLG-0012", "Campaign GP-2026-00309 cancelled and further delivery stopped."],
  ["2026-10-03T16:40:00", "Violation confirmed", "FLG-0012", "Violation confirmed. Campaign Cancelled applied."],
  ["2026-10-03T09:00:00", "Violation confirmed", "FLG-0011", "Violation confirmed. No Further Action applied."],
  ["2026-10-02T15:30:00", "Flag dismissed", "FLG-0010", "No violation found. The message is a standard promotional reminder."],
  ["2026-10-02T09:10:00", "Review started", "FLG-0009", "Flag moved to Under Review."],
  ["2026-09-30T18:15:00", "Flag dismissed", "FLG-0008", "No violation found. The link redirects to the sender's verified store domain."],
  ["2026-09-30T18:14:00", "Violation confirmed", "FLG-0006", "Violation confirmed. No Further Action applied."],
  ["2026-09-29T16:05:00", "User restricted", "FLG-0007", "Account activity restricted pending further review."],
  ["2026-09-27T14:50:30", "User suspended", "FLG-0005", "Account suspended and further platform activity prevented."],
  ["2026-09-27T14:50:00", "Violation confirmed", "FLG-0005", "Violation confirmed. User Suspended applied."],
  ["2026-09-26T17:30:00", "User restricted", "FLG-0004", "Account activity restricted pending further review."],
  ["2026-09-05T11:00:00", "Violation confirmed", "FLG-0001", "Violation confirmed. No Further Action applied."],
];

export const mockAuditLogs: AuditLog[] = auditSeeds.map(([at, action, recordId, details], index) => ({
  id: `AUD-${String(auditSeeds.length - index).padStart(4, "0")}`,
  at,
  adminName: COMPLIANCE_ADMIN,
  action,
  recordId,
  details,
}));

const disclaimerSeeds: [userId: string, version: string, acceptedAt: string, ip?: string, device?: string][] = [
  ["u-1004", "v1.3", "2026-10-05T08:12:00", "197.210.53.14", "Android 14"],
  ["u-1003", "v1.3", "2026-10-04T19:40:00", "102.89.34.7", "Android 13"],
  ["u-1012", "v1.3", "2026-10-03T12:05:00", "105.112.20.88", "iOS 17"],
  ["u-1008", "v1.3", "2026-10-02T09:15:00"],
  ["u-1010", "v1.3", "2026-10-01T17:22:00", "154.113.9.201", "Android 12"],
  ["u-1007", "v1.2", "2026-09-20T11:48:00", "41.58.77.3", "iOS 16"],
  ["u-1011", "v1.2", "2026-09-15T08:30:00"],
  ["u-1006", "v1.2", "2026-09-10T14:05:00", "197.210.11.42", "Android 14"],
  ["u-1002", "v1.1", "2026-08-25T10:10:00"],
  ["u-1001", "v1.1", "2026-08-22T13:35:00", "102.89.45.19", "iOS 16"],
  ["u-1009", "v1.1", "2026-08-18T16:20:00", "105.112.64.5", "Android 13"],
  ["u-1005", "v1.0", "2026-08-03T09:55:00"],
];

export const disclaimerVersions = ["v1.3", "v1.2", "v1.1", "v1.0"];

export const mockDisclaimerAcceptances: DisclaimerAcceptance[] = disclaimerSeeds.map(
  ([userId, version, acceptedAt, ip, device], index) => ({
    id: `DSC-${String(index + 1).padStart(4, "0")}`,
    userId,
    userName: userName(userId),
    version,
    acceptedAt,
    ip,
    device,
  }),
);
