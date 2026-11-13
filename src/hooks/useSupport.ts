import { create } from "zustand";

import { mockFaqs, mockHelpArticles } from "@/data/helpContent";
import { mockSupportTickets } from "@/data/mock";
import type {
  HelpContent,
  HelpContentKind,
  HelpContentStatus,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/types/support";

/** Display name for replies and notes until the signed-in admin's profile is available. */
export const SUPPORT_AUTHOR = "Support Admin";

export type HelpContentInput = Pick<HelpContent, "title" | "category" | "status" | "body">;

const idPrefix: Record<HelpContentKind, string> = { article: "ART", faq: "FAQ" };

const nextContentId = (kind: HelpContentKind, items: HelpContent[]) => {
  const highest = Math.max(0, ...items.map((item) => Number(item.id.split("-")[1]) || 0));
  return `${idPrefix[kind]}-${String(highest + 1).padStart(3, "0")}`;
};

// In-memory support data so ticket replies / status changes and article / FAQ
// edits show across the support pages. Replace with service calls once the
// support API exists.
type SupportState = {
  tickets: SupportTicket[];
  content: Record<HelpContentKind, HelpContent[]>;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  setTicketPriority: (id: string, priority: TicketPriority) => void;
  addTicketReply: (id: string, body: string) => void;
  addTicketNote: (id: string, body: string) => void;
  /** Returns the new item's ID. */
  createContent: (kind: HelpContentKind, input: HelpContentInput) => string;
  updateContent: (kind: HelpContentKind, id: string, input: HelpContentInput) => void;
  setContentStatus: (kind: HelpContentKind, id: string, status: HelpContentStatus) => void;
  deleteContent: (kind: HelpContentKind, id: string) => void;
};

export const useSupport = create<SupportState>()((set, get) => {
  const updateTicket = (id: string, change: (ticket: SupportTicket, now: string) => Partial<SupportTicket>) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id !== id) return ticket;
        const now = new Date().toISOString();
        return { ...ticket, ...change(ticket, now), updatedAt: now };
      }),
    }));

  const updateContentItems = (kind: HelpContentKind, change: (items: HelpContent[]) => HelpContent[]) =>
    set((state) => ({ content: { ...state.content, [kind]: change(state.content[kind]) } }));

  return {
    tickets: mockSupportTickets,
    content: { article: mockHelpArticles, faq: mockFaqs },
    setTicketStatus: (id, status) => updateTicket(id, () => ({ status })),
    setTicketPriority: (id, priority) => updateTicket(id, () => ({ priority })),
    addTicketReply: (id, body) =>
      updateTicket(id, (ticket, now) => ({
        messages: [
          ...ticket.messages,
          { id: `${id}-m${Date.now()}`, author: "admin", authorName: SUPPORT_AUTHOR, body, createdAt: now },
        ],
      })),
    addTicketNote: (id, body) =>
      updateTicket(id, (ticket, now) => ({
        notes: [...ticket.notes, { id: `${id}-n${Date.now()}`, authorName: SUPPORT_AUTHOR, body, createdAt: now }],
      })),
    createContent: (kind, input) => {
      const id = nextContentId(kind, get().content[kind]);
      updateContentItems(kind, (items) => [...items, { ...input, id, updatedAt: new Date().toISOString() }]);
      return id;
    },
    updateContent: (kind, id, input) =>
      updateContentItems(kind, (items) =>
        items.map((item) => (item.id === id ? { ...item, ...input, updatedAt: new Date().toISOString() } : item)),
      ),
    setContentStatus: (kind, id, status) =>
      updateContentItems(kind, (items) =>
        items.map((item) => (item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item)),
      ),
    deleteContent: (kind, id) => updateContentItems(kind, (items) => items.filter((item) => item.id !== id)),
  };
});
