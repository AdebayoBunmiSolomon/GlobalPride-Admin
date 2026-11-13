import type { LucideIcon } from "lucide-react";

import type { Tone } from "@/utils/tones";

export type CampaignStatus = "active" | "scheduled" | "completed" | "failed" | "cancelled";

export type CampaignType = "SMS" | "Image";

export interface CampaignDelivery {
  delivered: number;
  failed: number;
  pending: number;
}

export interface Campaign {
  /** Public campaign ID, e.g. "GP-2026-00321". Also used in the URL. */
  id: string;
  name: string;
  type: CampaignType;
  userId: string;
  userName: string;
  sender: string;
  recipients: number;
  status: CampaignStatus;
  /** ISO date. */
  createdAt: string;
  /** Absent until delivery has started (scheduled / cancelled campaigns). */
  delivery?: CampaignDelivery;
}

export type RecipientStatus = "delivered" | "failed" | "pending" | "not_sent";

export interface CampaignRecipient {
  id: string;
  name: string;
  phone: string;
  status: RecipientStatus;
}

export interface CampaignLogEntry {
  id: string;
  text: string;
  /** ISO date-time. */
  at: string;
  icon: LucideIcon;
  tone: Tone;
}
