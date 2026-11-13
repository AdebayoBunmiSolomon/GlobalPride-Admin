export type AdvertisementStatus = "active" | "scheduled" | "paused" | "ended";

/** Where the ad is shown in the mobile app. Only the Home Feed slot exists for now. */
export type AdvertisementPlacement = "home_feed";

export interface Advertisement {
  /** e.g. "AD-1001". */
  id: string;
  name: string;
  /** Informational only — not linked to a user account. */
  advertiser: string;
  /** Internal note; not shown in the mobile app. */
  description: string;
  /** Image URL (or data URL for creatives uploaded in the browser). */
  creative: string;
  ctaLabel: string;
  destinationUrl: string;
  placement: AdvertisementPlacement;
  status: AdvertisementStatus;
  /** Date only, "YYYY-MM-DD". */
  createdAt: string;
  /** Local date-time in the application timezone, "YYYY-MM-DDTHH:mm". */
  startAt: string;
  /** Local date-time in the application timezone, "YYYY-MM-DDTHH:mm". */
  endAt: string;
  /** Lifetime metrics; undefined until the ad has started serving. */
  impressions?: number;
  clicks?: number;
}
