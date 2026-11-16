// Responses returned by the GlobalPride API, and the normalized error shape.

/**
 * Envelope every GlobalPride API response is wrapped in (same backend as the
 * mobile app). A request can return HTTP 200 with `success: false`, so check
 * `success` (or use `unwrap` / `isApiSuccess` from `@/api/utils`).
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message?: string | null;
  errorCode?: string | null;
  /** The real causes; `message` is often generic ("Validation failed."). */
  errors?: string[] | null;
}

/**
 * Envelope the admin Identity API (`/identity/*`) wraps its responses in.
 * Same meaning as `ApiResponse`, different field names. `unwrap`,
 * `isApiSuccess` and the axios error normalizer accept either shape.
 */
export interface AdminResponse<T = unknown> {
  isSuccess: boolean;
  result: T | null;
  message?: string | null;
  /** Machine-readable error code, e.g. "INVALID_CREDENTIALS". */
  code?: string | null;
  /** Extra error lines (validation messages). */
  details?: string[] | null;
}

/** Either response envelope the backend uses. */
export type AnyApiResponse<T = unknown> = ApiResponse<T> | AdminResponse<T>;

/** What every rejected `apiClient` request rejects with (see the response interceptor in `client.ts`). */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: string[];
}

/** The signed-in administrator (`AdminProfileDto`). */
export interface AdminProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** `result` of POST /identity/login and POST /identity/refreshToken (`AdminAuthResult`). */
export interface AdminAuthResult {
  token: string;
  tokenExpiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string;
  user: AdminProfile | null;
}

/** Credentials in the shape `useAuth().login` takes, returned by `authService.login`. */
export interface LoginResult {
  token: string;
  refreshToken?: string | null;
  user?: AdminProfile | null;
}

/** `range` query of GET /admin/dashboard. Charts cover at most the last 90 days, even for `all`. */
export type DashboardRange = "today" | "7d" | "30d" | "90d" | "all";

/** `result` of GET /admin/dashboard. Money is in `currency` (NGN), in naira. */
export interface DashboardSummary {
  range: DashboardRange;
  /** Start of the period (midnight UTC), or null for `all`. */
  from: string | null;
  currency: string;
  stats: {
    /** All users, regardless of range. */
    totalUsers: number;
    /** Users who signed up in the period. */
    newUsers: number;
    /** Campaigns created in the period. */
    totalCampaigns: number;
    messagesSent: number;
    revenue: number;
    revenueIncludesVat: boolean;
  };
  requiresAttention: {
    failedCampaigns: number;
    pendingTransactions: number;
    failedTransactions: number;
    suspendedUsers: number;
  };
  /** One point per day ("YYYY-MM-DD"). */
  campaignPerformance: { date: string; campaignsCreated: number; messagesSent: number }[];
  /** One point per day ("YYYY-MM-DD"). */
  revenueOverview: { date: string; sms: number; image: number; audienceRental: number; total: number }[];
  /** Lower-case status names, e.g. "completed", "failed"; only statuses with campaigns are listed. */
  campaignStatus: { status: string; count: number }[];
  referrals: { total: number; successful: number; pending: number; bonusPaid: number };
  /** Latest platform activity, newest first. */
  recentActivities: ActivityItem[];
}

/** One entry of an activity feed (dashboard, user details, user activity). */
export interface ActivityItem {
  id: string;
  /** Activity type name, e.g. "AccountCreated", "WalletFunded", "CampaignCreated". */
  type: string;
  title: string;
  /** Written for the user ("You started funding your wallet…"). */
  description: string;
  /** UTC without an offset — read with `parseApiDate`. */
  createdAt: string;
  /** Set in platform-wide feeds; null in a single user's feed. */
  userName: string | null;
}

/** A page of results from a paginated admin endpoint. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type AdminUserStatus = "active" | "suspended";

/** Row of GET /admin/users. Money is in naira. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  campaigns: number;
  walletBalance: number;
  status: AdminUserStatus;
  /** A compliance decision has stopped the user sending or scheduling campaigns. */
  restricted: boolean;
  /** UTC without an offset — read with `parseApiDate`. */
  joinedAt: string;
}

/** `result` of GET /admin/users/{id}. */
export interface AdminUserDetails extends AdminUser {
  currency: string;
  referralCode: string | null;
  emailVerified: boolean;
  /** e.g. "Local", "Google". */
  signInMethod: string | null;
  lastLoginAt: string | null;
  campaignActivity: {
    total: number;
    completed: number;
    scheduled: number;
    draft: number;
    failed: number;
    cancelled: number;
    totalSpend: number;
  };
  walletActivity: { totalFunded: number; totalSpent: number; transactions: number };
  /** Latest activity, newest first. */
  recentActivity: ActivityItem[];
}

/** Lower-case campaign status from the admin campaigns API. */
export type AdminCampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed" | "cancelled";

/** Row of GET /admin/campaigns. */
export interface AdminCampaign {
  /** Public reference, e.g. "GP-2026-605233". Used in URLs; the API also accepts `campaignGuid`. */
  id: string;
  campaignGuid: string;
  name: string;
  /** "SMS" | "Image" (the API also documents audio / video). */
  type: string;
  userId: string;
  userName: string;
  /** Sender ID shown to recipients. */
  sender: string;
  recipients: number;
  status: AdminCampaignStatus;
  /** UTC without an offset — read with `parseApiDate`. */
  createdAt: string;
  delivery: {
    delivered: number;
    failed: number;
    pending: number;
    unconfirmed: number;
    /** False when the campaign has no delivery figures (e.g. Audience Marketplace). */
    tracked: boolean;
  };
}

/** `result` of GET /admin/campaigns/{id}. Money is in `currency` (NGN). Dates are UTC without an offset. */
export interface AdminCampaignDetails extends AdminCampaign {
  category: string | null;
  message: string | null;
  personalizationEnabled: boolean;
  /** "MyContacts" | "ContactGroups" | "AudienceMarketplace". */
  recipientSource: string | null;
  imageFileName: string | null;
  /** Image campaigns only, e.g. "SmsLink". */
  imageDeliveryChannel: string | null;
  /** Audience Marketplace targeting; null for contact-based campaigns. */
  audience: {
    /** e.g. "State", "LocalGovernment". */
    coverage: string | null;
    states: string[];
    localGovernments: string[];
    gender: string | null;
  } | null;
  estimatedCost: number | null;
  actualCost: number | null;
  currency: string;
  deliveryRate: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  failureReason: string | null;
  userEmail: string | null;
  userPhone: string | null;
}

/**
 * not_applicable: Audience Marketplace (nothing sent per number) or not sent yet ·
 * awaiting_receipts · final · summary_only: sent before per-recipient tracking, totals only.
 */
export type DeliveryReportState = "not_applicable" | "awaiting_receipts" | "final" | "summary_only";

/** `result` of GET /admin/campaigns/{id}/delivery-report (and POST …/refresh). */
export interface CampaignDeliveryReport {
  campaignId: string;
  reference: string;
  title: string;
  /** Numeric enum; use the campaign's own `status` string instead. */
  status: number;
  messageType: number;
  recipientCount: number;
  totalCost: number | null;
  currency: string;
  sentAt: string | null;
  /** Of the accepted messages, those confirmed delivered. */
  deliveredCount: number | null;
  deliveryRatePercent: number | null;
  imageDeliveryChannel: number | null;
  /** Recipients the gateway took at send time. */
  acceptedCount: number | null;
  failedCount: number;
  pendingCount: number;
  /** Accepted, but no receipt came back in time. A late receipt still updates it. */
  unconfirmedCount: number;
  /** SMS pages charged (accepted × pages); null when nothing went by SMS. */
  unitsUsed: number | null;
  reportState: DeliveryReportState;
  /** True once nothing is waiting on a receipt. */
  isFinal: boolean;
  /** True when …/delivery-report/recipients has per-recipient rows. */
  hasRecipientDetail: boolean;
  /** When the newest per-recipient status changed. */
  lastUpdatedAt: string | null;
  breakdown: { status: string; label: string; count: number }[];
  failureReasons: { reason: string; count: number }[];
  /** A sentence to show under the numbers when they need explaining. */
  note: string | null;
  /** SMS-link image campaigns: landing-page opens (includes repeats and link previews). */
  imageLinkOpenCount: number | null;
}

/** Recipient delivery status: delivered | failed | pending | unconfirmed. */
export type RecipientDeliveryStatus = "delivered" | "failed" | "pending" | "unconfirmed";

/** Row of GET /admin/campaigns/{id}/delivery-report/recipients. */
export interface CampaignRecipientDelivery {
  id: number;
  name: string | null;
  phoneNumber: string | null;
  /** "SMS" or "WhatsApp". */
  channel: string | null;
  status: RecipientDeliveryStatus | null;
  /** e.g. "Delivered", "Awaiting receipt", "Rejected". */
  label: string | null;
  /** Failure reason or the gateway's status text. */
  detail: string | null;
  sentAt: string;
  deliveredAt: string | null;
}

/** Row of GET /admin/campaigns/{id}/recipients (who the campaign was addressed to). */
export interface CampaignRecipient {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  deliveryStatus: RecipientDeliveryStatus | null;
}

/** `result` of GET /admin/campaigns/{id}/recipients. */
export interface CampaignRecipientsPage extends PagedResult<CampaignRecipient> {
  perRecipientStatusAvailable: boolean;
  /** Explains an empty or partial list (e.g. Audience Marketplace campaigns store no list). */
  note: string | null;
}

/** Where a pricing value comes from: the server's default `config`, or set by an `admin`. */
export type PricingSource = "config" | "admin";

/** Campaign pricing keys the API can update (voice / video are `coming_soon` and have no price). */
export type CampaignPriceKey = "sms" | "image_sms_link" | "image_whatsapp" | "image_both" | "audience_rental";

/** Row of `campaignPricing` in GET /admin/pricing. */
export interface CampaignPrice {
  key: CampaignPriceKey | (string & {});
  name: string;
  /** e.g. "per recipient"; empty for services that aren't available yet. */
  unit: string;
  /** `null` while the service is `coming_soon`. */
  price: number | null;
  currency: string;
  status: "active" | "coming_soon";
  source: PricingSource;
}

/** `result` of GET /admin/pricing, and of every PUT /admin/pricing/* (the updated settings). */
export interface PricingSettings {
  currency: string;
  campaignPricing: CampaignPrice[];
  vat: { ratePercent: number; source: PricingSource };
  referralBonus: {
    amount: number;
    currency: string;
    /** e.g. "wallet_credit" */
    rewardType: string;
    /** e.g. "successful_referral" */
    trigger: string;
    source: PricingSource;
  };
}

/** `result` of GET /admin/audience/summary. */
export interface AudienceSummary {
  /** True while no real contacts have been uploaded and the built-in demo data is shown. */
  isSampleData: boolean;
  totalRecords: number;
  maleRecords: number;
  femaleRecords: number;
  /** States (and FCT) with contacts loaded. */
  locationsCovered: number;
  lgasCovered: number;
  /** UTC without an offset (read with `parseApiDate`); null before the first upload. */
  lastUpdated: string | null;
}

/** Row of GET /admin/audience/states (every state and FCT, zero when no data). */
export interface AudienceStateRow {
  name: string;
  totalRecords: number;
  maleRecords: number;
  femaleRecords: number;
  lgaCount: number;
}

/** Row of GET /admin/audience/states/{state}/lgas (only LGAs with contacts). */
export interface AudienceLgaRow {
  name: string;
  state: string;
  totalRecords: number;
  maleRecords: number;
  femaleRecords: number;
}

export type AudienceGender = "male" | "female" | "unknown";

/**
 * One contact from GET /admin/audience/records and /records/{id}. Swagger doesn't
 * document this shape, so `audienceService` normalizes the raw row into it.
 */
export interface AudienceRecord {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  state: string | null;
  lga: string | null;
  gender: AudienceGender;
  /** When the contact was loaded, if the API says. */
  createdAt: string | null;
}

/**
 * One file's outcome from POST /admin/audience/upload. Swagger doesn't document
 * this shape either, so `audienceService` normalizes it.
 */
export interface AudienceUploadFileResult {
  fileName: string;
  added: number;
  /** Already stored from an earlier upload. */
  alreadyStored: number;
  /** Repeated within this file. */
  repeated: number;
  rejected: number;
  /** Why rows were rejected (or why the file failed). */
  reasons: string[];
}

/** `result` of GET /admin/wallets/summary. Money is in `currency` (NGN). */
export interface AdminWalletSummary {
  currency: string;
  /** Held across all user wallets right now. */
  totalWalletBalance: number;
  /** Successful wallet funding to date. */
  totalWalletFunding: number;
  totalReferralBonusCredits: number;
  totalTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}

/** Transaction category (the `?category=` filter). Other values may appear as the API grows. */
export type WalletTransactionCategory = "funding" | "sms_campaign" | "image_campaign" | "audience_rental";

export type AdminWalletTransactionStatus = "pending" | "processing" | "successful" | "failed" | "cancelled";

/** Row of GET /admin/wallets/transactions. Dates are UTC without an offset. */
export interface AdminWalletTransaction {
  /** Public reference, e.g. "GP-TRX-6769FC0959C". */
  id: string;
  transactionGuid: string;
  userId: string;
  userName: string;
  /** Display name, e.g. "Image Campaign". */
  type: string;
  category: WalletTransactionCategory | (string & {});
  direction: "credit" | "debit";
  /** Always positive; `direction` gives the sign. */
  amount: number;
  currency: string;
  status: AdminWalletTransactionStatus | (string & {});
  /** e.g. "Wallet", "DebitCard", "BankTransfer". */
  paymentMethod: string | null;
  createdAt: string;
}

/** `result` of GET /admin/wallets/transactions/{id} (reference or GUID). */
export interface AdminWalletTransactionDetails extends AdminWalletTransaction {
  /** Payment provider reference (funding only). */
  paymentReference: string | null;
  description: string | null;
  /** Public campaign reference for campaign charges. */
  campaignId: string | null;
  campaignName: string | null;
  cardLast4: string | null;
  cardType: string | null;
  bankName: string | null;
  updatedAt: string | null;
  amountCredited: number;
  amountDeducted: number;
  /** The user's wallet balance now (not just after this transaction). */
  currentWalletBalance: number;
}

/** `result` of GET /admin/referrals/summary. Money is in `currency` (NGN). */
export interface AdminReferralSummary {
  currency: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalBonusPaid: number;
  /** The bonus currently configured in Pricing Management. */
  currentBonusAmount: number;
}

/** The API's `?status=` values. */
export type ReferralStatus = "successful" | "pending";

export type ReferralBonusStatus = "pending" | "paid" | "failed";

/**
 * A row of GET /admin/referrals, normalized by `referralsService` (Swagger
 * documents no body, so fields are read defensively). Dates are API strings;
 * read them with `parseApiDate`.
 */
export interface AdminReferral {
  /** GUID; the details endpoint takes it. */
  id: string;
  /** Code the invite was made with. */
  code: string | null;
  referrerId: string | null;
  referrerName: string | null;
  /** Email or phone the invite was sent to. */
  inviteeContact: string | null;
  /** Set once the invited contact has signed up. */
  referredUserId: string | null;
  referredUserName: string | null;
  status: ReferralStatus;
  bonusStatus: ReferralBonusStatus;
  /** Bonus credited (or due); null when the API doesn't say. */
  bonusAmount: number | null;
  createdAt: string | null;
  /** When the invited contact signed up. */
  joinedAt: string | null;
  /** When the referral qualified for its bonus. */
  qualifiedAt: string | null;
}

/** `result` of GET /admin/referrals/{id}. */
export interface AdminReferralDetails extends AdminReferral {
  /** Wallet transaction reference (or GUID) of the bonus credit. */
  bonusTransactionId: string | null;
  bonusCreditedAt: string | null;
}

/** `result` of GET /admin/advertisements/summary. */
export interface AdminAdvertisementSummary {
  total: number;
  active: number;
  scheduled: number;
  paused: number;
  ended: number;
  totalImpressions: number;
  totalClicks: number;
  clickThroughRatePercent: number;
}

/** The API's `?status=` values (besides `all`). */
export type AdvertisementStatus = "active" | "scheduled" | "paused" | "ended";

/**
 * An advertisement from GET /admin/advertisements or /{id}, normalized by
 * `advertisementsService` (Swagger documents no body, so fields are read
 * defensively). Dates are API strings; read them with `parseApiDate`.
 */
export interface AdminAdvertisement {
  /** Numeric ID (as a string). The API takes it or `code`. */
  id: string;
  /** Public code, e.g. "AD-1001"; used in URLs. Falls back to `id`. */
  code: string;
  name: string;
  /** Informational only — not linked to a user account. */
  advertiser: string;
  /** Internal note; not shown in the mobile app. */
  description: string;
  /** Absolute image URL, or null if the API sent none. */
  creativeUrl: string | null;
  ctaLabel: string;
  destinationUrl: string;
  /** e.g. "home_feed". */
  placement: string;
  status: AdvertisementStatus;
  createdAt: string | null;
  startAt: string;
  endAt: string;
  /** Lifetime metrics; null when the API sends none. */
  impressions: number | null;
  clicks: number | null;
}

// ---- Support (/admin/support) ----

export type TicketStatus = "open" | "in_progress" | "pending_user" | "resolved" | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

/** GET /admin/support/tickets/summary. Counts are null when the API sends none. */
export interface AdminTicketSummary {
  total: number | null;
  open: number | null;
  inProgress: number | null;
  pendingUser: number | null;
  resolved: number | null;
  closed: number | null;
}

/** A row of GET /admin/support/tickets. */
export interface AdminSupportTicket {
  /** GUID. */
  id: string;
  /** e.g. "TKT-MSKH6H8Z-2S54" (falls back to the GUID); used in URLs. */
  reference: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  subject: string;
  /** Free text from the app's "Report a Problem" screen, e.g. "wallet". */
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  /** Last reply, note or status / priority change. */
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  author: "user" | "admin";
  authorName: string;
  body: string;
  createdAt: string;
}

/** Support-team note; never shown to the user. */
export interface TicketNote {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/** GET /admin/support/tickets/{id}. */
export interface AdminSupportTicketDetails extends AdminSupportTicket {
  /** What the user wrote when reporting the problem. */
  description: string | null;
  /** The conversation, oldest first. */
  messages: TicketMessage[];
  notes: TicketNote[];
}

/** Help articles and FAQs share one shape: `title` is the question for FAQs, `body` the answer. */
export type HelpContentKind = "article" | "faq";

/** The API's names; "draft" is shown as Unpublished. */
export type HelpContentStatus = "published" | "draft";

/** A help article or FAQ from /admin/support/articles or /admin/support/faqs. */
export interface AdminHelpContent {
  /** GUID. */
  id: string;
  title: string;
  /** Free text, e.g. "wallet". */
  category: string;
  /** Articles only: short description shown in the app's article list. */
  summary: string;
  status: HelpContentStatus;
  /** Rich text (HTML). Null when the list row doesn't include it (load the item for it). */
  body: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
}

// ---- Settings (/admin/settings) ----

/** GET /admin/settings, mapped to the console's settings shapes. */
export interface AdminSettings {
  general: import("@/types/settings").GeneralSettings;
  notifications: import("@/types/settings").NotificationSettings;
  security: import("@/types/settings").SecuritySettings;
}

/** GET /admin/settings/sms-balance. Gateway problems come back as `available: false` with a message. */
export interface SmsBalance {
  available: boolean;
  /** Remaining SMS units; null when unavailable. */
  balance: number | null;
  message: string | null;
}

/** GET /admin/settings/system-info: every simple field the API sends, as label / value pairs. */
export type SystemInfo = { key: string; value: string }[];

// ---- Announcements (/admin/announcements) ----

export type AnnouncementStatus = "scheduled" | "sending" | "sent" | "cancelled";

/** An "All Users" announcement. */
export interface AdminAnnouncement {
  /** Number, e.g. "12". */
  id: string;
  /** e.g. "NOT-000012" (falls back to the number); used in URLs. */
  code: string;
  title: string;
  message: string;
  status: AnnouncementStatus;
  createdAt: string | null;
  /** When it is (or was) due to go out. */
  scheduledAt: string | null;
  sentAt: string | null;
  /** Users it was delivered to; null until sent or when not reported. */
  recipients: number | null;
  /** Recipients who opened it; null when not reported. */
  readCount: number | null;
  /** The admin who created it, when the API says. */
  createdBy: string | null;
}

/** GET /admin/announcements/summary. Counts are null when the API sends none. */
export interface AdminAnnouncementSummary {
  total: number | null;
  scheduled: number | null;
  sending: number | null;
  sent: number | null;
  cancelled: number | null;
}

// ---- Compliance (/admin/compliance) ----

export type FlagSource = "system" | "campaign" | "content_report" | "account" | "referral";

export type FlagSeverity = "low" | "medium" | "high" | "critical";

/** pending_review → under_review → resolved (violation confirmed) or dismissed (no violation). */
export type FlagStatus = "pending_review" | "under_review" | "resolved" | "dismissed";

/** Enforcement taken when a violation is confirmed. */
export type FlagAction = "campaign_cancelled" | "user_suspended" | "user_restricted" | "no_further_action";

export interface ComplianceNote {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/** A row of GET /admin/compliance/flags, or (with notes and content) one flag. */
export interface ComplianceFlag {
  /** Number, e.g. "12". */
  id: string;
  /** e.g. "FLG-0012" (falls back to the number); used in URLs. */
  code: string;
  userId: string | null;
  userName: string;
  /** Short title of what was flagged. */
  activity: string;
  reason: string;
  source: FlagSource;
  severity: FlagSeverity;
  status: FlagStatus;
  createdAt: string;
  updatedAt: string;
  /** The message that triggered the flag, when captured. */
  content: { label: string; text: string } | null;
  /** Campaign reference (GP-…), when the flag is about a campaign. */
  campaignId: string | null;
  campaignName: string | null;
  /** Content report that raised this flag. */
  reportId: string | null;
  action: FlagAction | null;
  dismissedReason: string | null;
  closedBy: string | null;
  closedAt: string | null;
  notes: ComplianceNote[];
}

/** GET /admin/compliance/summary. Counts are null when the API sends none. */
export interface ComplianceSummary {
  total: number | null;
  pendingReview: number | null;
  underReview: number | null;
  resolved: number | null;
  dismissed: number | null;
}

export type ReportReason =
  | "harassment"
  | "spam_abuse"
  | "fraud_deception"
  | "privacy_concern"
  | "prohibited_content"
  | "other";

/** A user's report about another user's message. Its status follows the flag it raised. */
export interface ContentReport {
  id: string;
  reporterId: string | null;
  reporterName: string;
  reportedUserId: string | null;
  reportedUserName: string;
  content: string;
  reason: ReportReason;
  status: FlagStatus;
  createdAt: string;
  /** Code (or number) of the flag it raised, if any. */
  flagId: string | null;
}

export type CampaignComplianceStatus = "flagged" | "under_review" | "resolved";

/** A campaign that has been flagged at least once. */
export interface FlaggedCampaign {
  /** Campaign reference (GP-…). */
  id: string;
  name: string;
  userId: string | null;
  userName: string;
  status: CampaignComplianceStatus;
  flagCount: number;
  openFlagCount: number;
  lastFlaggedAt: string | null;
  lastReviewedAt: string | null;
}

/** What an administrator did in the console. */
export interface AuditLog {
  id: string;
  at: string;
  adminName: string;
  action: string;
  /** The record acted on, e.g. "FLG-0012" or "GP-2026-605233". */
  recordId: string | null;
  details: string;
}

/** When a user accepted the campaign responsibility disclaimer. */
export interface DisclaimerAcceptance {
  id: string;
  userId: string | null;
  userName: string;
  version: string | null;
  acceptedAt: string;
  /** Campaign the disclaimer was accepted for, when sent. */
  campaignId: string | null;
  ip: string | null;
  device: string | null;
}

/** One page of a server-paged compliance log. */
export interface LogPage<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
}

// ---- Finance (/admin/finance) ----

/** Revenue from one service (SMS, image, audience rental) in the period. */
export interface FinanceServiceRevenue {
  /** As sent, e.g. "sms". */
  service: string;
  label: string;
  amount: number;
  vat: number | null;
  transactions: number | null;
}

/** GET /admin/finance/summary for a date range. Figures are null when the API sends none. */
export interface FinanceSummary {
  grossRevenue: number | null;
  vatCollected: number | null;
  /** Percent, e.g. 7.5. */
  vatRate: number | null;
  refunds: number | null;
  refundCount: number | null;
  referralBonuses: number | null;
  referralCount: number | null;
  usersRewarded: number | null;
  funding: number | null;
  fundingCount: number | null;
  fundingPending: number | null;
  fundingFailed: number | null;
  revenueByService: FinanceServiceRevenue[];
  /** Per-day revenue, oldest first ("YYYY-MM-DD"). */
  series: { date: string; total: number; vat: number | null }[];
}

/** One row of a finance report (revenue, VAT, funding, referral bonuses or refunds). */
export interface FinanceReportRow {
  id: string;
  /** Transaction reference (GP-TRX-…), used to link to its details. */
  reference: string;
  userId: string | null;
  userName: string;
  service: string | null;
  /** Service amount (before VAT) or credited amount. */
  amount: number | null;
  vat: number | null;
  /** What the customer paid (service + VAT). */
  total: number | null;
  status: string | null;
  paymentReference: string | null;
  /** Refunds: the transaction that was refunded. */
  originalReference: string | null;
  createdAt: string | null;
}
