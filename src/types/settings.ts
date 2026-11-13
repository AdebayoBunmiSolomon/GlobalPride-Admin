export interface GeneralSettings {
  platformName: string;
  description: string;
  /** Empty when not configured. */
  supportEmail: string;
  /** Empty when not configured. */
  supportPhone: string;
  /** Logo as a data URL; empty to use the default Global Pride logo. */
  logo: string;
  /** IANA time zone, e.g. "Africa/Lagos". */
  timeZone: string;
}

/** Which automatically generated notifications users receive, and whether admins can send announcements. */
export interface NotificationSettings {
  campaign: boolean;
  wallet: boolean;
  referral: boolean;
  support: boolean;
  account: boolean;
  adminAnnouncements: boolean;
}

export interface SecuritySettings {
  /** Minutes of inactivity before an administrator is signed out. */
  sessionTimeout: number;
  requireStrongPasswords: boolean;
}
