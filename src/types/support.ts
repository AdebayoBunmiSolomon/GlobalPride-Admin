import type { RelatedRecord } from "./related";

// ---- Support tickets ----

export type TicketStatus = "open" | "in_progress" | "pending_user" | "resolved" | "closed";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketCategory = "wallet" | "campaign" | "referral" | "account" | "audience" | "technical";

export interface TicketMessage {
  id: string;
  author: "user" | "admin";
  authorName: string;
  body: string;
  /** ISO date-time. */
  createdAt: string;
}

/** Support-team note; never shown to the user. */
export interface TicketNote {
  id: string;
  authorName: string;
  body: string;
  /** ISO date-time. */
  createdAt: string;
}

/** Record the ticket is about, linked from "Related Information". */
export type TicketRelatedRecord = RelatedRecord;

export interface SupportTicket {
  /** e.g. "SUP-001245". */
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  /** ISO date-time. */
  createdAt: string;
  /** ISO date-time of the last reply, note or status / priority change. */
  updatedAt: string;
  messages: TicketMessage[];
  notes: TicketNote[];
  related?: TicketRelatedRecord;
}

// ---- Help articles & FAQs ----

/** Help articles and FAQs share one shape: `title` is the question for FAQs, `body` the answer. */
export type HelpContentKind = "article" | "faq";

export type HelpContentCategory = "account" | "wallet" | "campaigns" | "audience" | "referrals" | "general";

export type HelpContentStatus = "published" | "unpublished";

export interface HelpContent {
  /** e.g. "ART-001" or "FAQ-001". */
  id: string;
  title: string;
  category: HelpContentCategory;
  status: HelpContentStatus;
  /** Rich text as HTML (h2, p, strong, em, ul, ol, li, a). */
  body: string;
  /** ISO date-time. */
  updatedAt: string;
}
