import {
  Activity,
  CircleAlert,
  Database,
  Gift,
  KeyRound,
  Megaphone,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/utils/tones";

/** Icon and colour for an activity `type` name, e.g. "WalletFundingInitiated". */
export const activityStyle = (type: string): { icon: LucideIcon; tone: Tone } => {
  if (/fail|reject|cancel|suspend/i.test(type)) return { icon: CircleAlert, tone: "red" };
  if (/wallet|payment|fund|refund/i.test(type)) return { icon: Wallet, tone: "blue" };
  if (/campaign/i.test(type)) return { icon: Megaphone, tone: "green" };
  if (/referral|bonus/i.test(type)) return { icon: Gift, tone: "green" };
  if (/contact|audience/i.test(type)) return { icon: Database, tone: "gray" };
  if (/password|security|sign/i.test(type)) return { icon: KeyRound, tone: "amber" };
  if (/account|user|profile/i.test(type)) return { icon: User, tone: "purple" };
  return { icon: Activity, tone: "gray" };
};

/** "WalletFundingInitiated" → "Wallet Funding Initiated". */
export const humanizeType = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * `type` values GET /admin/users/{id}/activity and /admin/compliance/activity-logs accept (the API rejects
 * unknown names with a 400). Swagger lists the ActivityType enum (0–11) by
 * number only; these names were confirmed against the API. One value (likely 8)
 * is still unidentified, so it can only be seen under "All Activity".
 */
export const activityTypeOptions = [
  { label: "All Activity", value: "all" },
  { label: "Account Created", value: "AccountCreated" },
  { label: "Account Verified", value: "AccountVerified" },
  { label: "Profile Updated", value: "ProfileUpdated" },
  { label: "Password Changed", value: "PasswordChanged" },
  { label: "Wallet Funding Initiated", value: "WalletFundingInitiated" },
  { label: "Wallet Funded", value: "WalletFunded" },
  { label: "Wallet Funding Failed", value: "WalletFundingFailed" },
  { label: "Referral Bonus Earned", value: "ReferralBonusEarned" },
  { label: "Campaign Created", value: "CampaignCreated" },
  { label: "Campaign Cancelled", value: "CampaignCancelled" },
  { label: "Contacts Uploaded", value: "ContactsUploaded" },
];
