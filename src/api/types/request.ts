// Request bodies sent to the GlobalPride API.

/** POST /identity/login (admin sign-in) */
export interface LoginPayload {
  email: string;
  password: string;
}

/** POST /identity/refreshToken */
export interface RefreshTokenPayload {
  refreshToken: string;
  /** The access token being replaced. */
  token: string | null;
}

/** Query of GET /admin/users. */
export interface AdminUsersQuery {
  /** Matches name, email or phone. */
  search?: string;
  status?: "all" | "active" | "suspended";
  page?: number;
  /** Capped at 100 by the API. */
  pageSize?: number;
}

/** Query of GET /admin/users/{id}/activity. */
export interface AdminUserActivityQuery {
  /** Activity type name (e.g. "WalletFunded"); omit for everything. */
  type?: string;
  page?: number;
  pageSize?: number;
}

/** PUT /admin/pricing/campaign/{key} */
export interface SetCampaignPricePayload {
  price: number;
}

/** PUT /admin/pricing/vat */
export interface SetVatRatePayload {
  ratePercent: number;
}

/** PUT /admin/pricing/referral-bonus */
export interface SetReferralBonusPayload {
  amount: number;
}

/** Query of GET /admin/audience/records. State and LGA are names, e.g. "Akwa Ibom". */
export interface AudienceRecordsQuery {
  /** A phone-number prefix, or part of a name. */
  search?: string;
  state?: string;
  lga?: string;
  gender?: "male" | "female" | "unknown";
  page?: number;
  pageSize?: number;
}

/** Query of DELETE /admin/audience/records: one state, or one LGA of a state. */
export interface DeleteAudienceRecordsQuery {
  state: string;
  lga?: string;
}

/** PUT /identity/me */
export interface UpdateProfilePayload {
  fullName: string;
  email: string;
}

/** POST /identity/change-password */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * POST /admin/advertisements and PUT /admin/advertisements/{id}, sent as
 * multipart/form-data. Dates are ISO date-times (UTC unless an offset is given).
 */
export interface AdvertisementPayload {
  name: string;
  advertiser: string;
  description: string;
  /** At most 20 characters. */
  ctaLabel: string;
  /** http(s) link opened when the ad is tapped. */
  destinationUrl: string;
  placement: string;
  startAt: string;
  endAt: string;
  /** jpeg, png, gif or webp, at most 5 MB. Required when creating; optional when editing (keeps the current one). */
  creative?: File;
}

/** POST /admin/support/articles and PUT /admin/support/articles/{id}. */
export interface HelpArticlePayload {
  title: string;
  category: string;
  summary: string;
  /** Rich text (HTML); the API strips anything outside its allowed formatting tags. */
  content: string;
  /** Publish straight away (create), or the status wanted after saving (update). */
  publish: boolean;
}

/** POST /admin/support/faqs and PUT /admin/support/faqs/{id}. */
export interface FaqPayload {
  category: string;
  question: string;
  /** Rich text (HTML). */
  answer: string;
  publish: boolean;
}

/** PUT /admin/support/tickets/{id}/status */
export interface TicketStatusPayload {
  status: string;
}

/** PUT /admin/support/tickets/{id}/priority */
export interface TicketPriorityPayload {
  priority: string;
}

/** POST /admin/support/tickets/{id}/reply and /notes */
export interface TicketMessagePayload {
  message: string;
}

/** PUT /admin/settings/general */
export interface GeneralSettingsPayload {
  platformName: string;
  description: string;
  supportEmail: string;
  supportPhone: string;
  /** IANA name, e.g. Africa/Lagos. */
  timeZone: string;
  /** A data: URI (png, jpeg or webp, at most about 400 KB), or empty for no logo. */
  logo: string;
}

/** PUT /admin/settings/notifications */
export interface NotificationSettingsPayload {
  campaignNotifications: boolean;
  walletNotifications: boolean;
  referralNotifications: boolean;
  supportNotifications: boolean;
  accountNotifications: boolean;
  /** When off, announcements can't be created and queued ones wait. */
  allowAnnouncements: boolean;
}

/** PUT /admin/settings/security */
export interface SecuritySettingsPayload {
  /** 5-1440. */
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
}

/** POST /admin/promotions and PUT /admin/promotions/{id}. The API works out the status from the dates. */
export interface PromotionPayload {
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: "sms" | "image" | "audience_rental";
  /** yyyy-MM-dd. */
  startDate: string;
  /** yyyy-MM-dd. */
  endDate: string;
}

/** POST /admin/announcements and PUT /admin/announcements/{id}. Sent to all users. */
export interface AnnouncementPayload {
  /** At most 100 characters. */
  title: string;
  /** At most 500 characters. */
  message: string;
  delivery: "now" | "later";
  /** Required when `delivery` is "later": an ISO date-time in the future. */
  scheduledAt: string | null;
}

/** POST /admin/compliance/flags/{id}/decision: confirms a violation and takes the action. */
export interface FlagDecisionPayload {
  action: "campaign_cancelled" | "user_suspended" | "user_restricted" | "no_further_action";
}

/** POST /admin/compliance/flags/{id}/dismiss: no violation found. */
export interface FlagDismissPayload {
  reason: string;
}

/** POST /admin/compliance/flags/{id}/notes */
export interface FlagNotePayload {
  note: string;
}
