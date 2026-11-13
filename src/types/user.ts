import type { LucideIcon } from "lucide-react";

import type { CampaignStatus, CampaignType } from "@/types/campaign";
import type { Tone } from "@/utils/tones";

export type UserStatus = "active" | "suspended";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  campaigns: number;
  /** In naira. */
  walletBalance: number;
  status: UserStatus;
  /** ISO date. */
  joinedAt: string;
}

export interface UserCampaign {
  id: string;
  name: string;
  channel: CampaignType;
  date: string;
  status: CampaignStatus;
}

export interface WalletTransaction {
  id: string;
  label: string;
  date: string;
  /** Signed, in naira: positive = credit, negative = debit. */
  amount: number;
}

export type UserActivityType = "account" | "campaign" | "wallet" | "referral";

export interface UserActivity {
  id: string;
  type: UserActivityType;
  text: string;
  /** ISO date-time. */
  at: string;
  icon: LucideIcon;
  tone: Tone;
}
