import { supportService, type HelpContentInput } from "@/api/services/support";
import type {
  AdminHelpContent,
  AdminSupportTicket,
  AdminSupportTicketDetails,
  HelpContentKind,
  TicketPriority,
  TicketStatus,
} from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";

// ---- Tickets ----

/** GET /admin/support/tickets/summary. */
export const ticketSummaryQuery = createQueryStore(() => supportService.ticketSummary(), {
  keyOf: () => "summary",
  staleTime: 60_000,
});

/** Every ticket; searched, filtered and paged in the browser. */
export const ticketsQuery = createQueryStore(() => supportService.listTickets(), {
  keyOf: () => "all",
  staleTime: 60_000,
});

/** One ticket by reference (TKT-…) or GUID, as it appears in the URL. */
export const ticketQuery = createQueryStore((id: string) => supportService.ticket(id), {
  keyOf: (id) => id,
  staleTime: 30_000,
});

export const useTicketSummary = () => ticketSummaryQuery.useQuery();
export const useTicketList = () => ticketsQuery.useQuery();
export const useTicket = (id: string) => ticketQuery.useQuery(id);

const toRow = (ticket: AdminSupportTicketDetails): AdminSupportTicket => {
  const row: Partial<AdminSupportTicketDetails> = { ...ticket };
  delete row.description;
  delete row.messages;
  delete row.notes;
  return row as AdminSupportTicket;
};

/** Puts a ticket's new state in every cache that holds it. Status counts may change, so the summary is marked stale. */
const applyTicket = (ticket: AdminSupportTicketDetails) => {
  ticketsQuery.setData([], (tickets) => tickets.map((cached) => (cached.id === ticket.id ? toRow(ticket) : cached)));
  ticketQuery.setAllData((cached) => (cached.id === ticket.id ? ticket : cached));
  ticketSummaryQuery.invalidate();
};

/**
 * Applies a ticket mutation's result. Responses aren't documented, so when one
 * carries no ticket the change is applied locally (from what the action is
 * known to do) and the ticket is refetched for the server's version.
 */
const afterTicketChange = (
  ticket: AdminSupportTicketDetails,
  result: { ticket: AdminSupportTicketDetails | null },
  local: (ticket: AdminSupportTicketDetails, now: string) => Partial<AdminSupportTicketDetails>,
) => {
  if (result.ticket) {
    applyTicket(result.ticket);
    return;
  }
  const now = new Date().toISOString();
  applyTicket({ ...ticket, ...local(ticket, now), updatedAt: now });
  ticketsQuery.invalidate();
  ticketQuery.invalidate();
  void ticketQuery.fetch([ticket.reference], { force: true });
};

/*
 * Ticket actions: call the API, then update the cache so the list and
 * details reflect the change. Each rejects with the API's `ApiError`.
 */

export const setTicketStatus = async (ticket: AdminSupportTicketDetails, status: TicketStatus) => {
  const result = await supportService.setTicketStatus(ticket.reference, status);
  afterTicketChange(ticket, result, () => ({ status }));
  return result;
};

export const setTicketPriority = async (ticket: AdminSupportTicketDetails, priority: TicketPriority) => {
  const result = await supportService.setTicketPriority(ticket.reference, priority);
  afterTicketChange(ticket, result, () => ({ priority }));
  return result;
};

/** Sends a reply the user can see; the API moves the ticket to Pending User. `authorName` is the signed-in admin. */
export const replyToTicket = async (ticket: AdminSupportTicketDetails, message: string, authorName: string) => {
  const result = await supportService.replyToTicket(ticket.reference, message);
  afterTicketChange(ticket, result, (current, now) => ({
    status: "pending_user",
    messages: [
      ...current.messages,
      { id: `local-${Date.now()}`, author: "admin", authorName, body: message, createdAt: now },
    ],
  }));
  return result;
};

/** Adds an internal note (administrators only). `authorName` is the signed-in admin. */
export const addTicketNote = async (ticket: AdminSupportTicketDetails, message: string, authorName: string) => {
  const result = await supportService.addTicketNote(ticket.reference, message);
  afterTicketChange(ticket, result, (current, now) => ({
    notes: [...current.notes, { id: `local-${Date.now()}`, authorName, body: message, createdAt: now }],
  }));
  return result;
};

// ---- Help articles & FAQs ----

/** Every article or FAQ (published and draft); searched, filtered and paged in the browser. */
export const helpContentListQuery = createQueryStore((kind: HelpContentKind) => supportService.listContent(kind), {
  keyOf: (kind) => kind,
  staleTime: 60_000,
});

/** One article or FAQ by GUID, with its full body. */
export const helpContentQuery = createQueryStore(
  (kind: HelpContentKind, id: string) => supportService.content(kind, id),
  { keyOf: (kind, id) => `${kind}:${id}`, staleTime: 60_000 },
);

export const useHelpContentList = (kind: HelpContentKind) => helpContentListQuery.useQuery(kind);
export const useHelpContent = (kind: HelpContentKind, id: string) => helpContentQuery.useQuery(kind, id);

/** List rows may lack the body; keep the cached one rather than dropping it. */
const merge = (cached: AdminHelpContent, item: AdminHelpContent) => ({ ...item, body: item.body ?? cached.body });

const applyContent = (kind: HelpContentKind, item: AdminHelpContent) => {
  helpContentListQuery.setData([kind], (items) => items.map((cached) => (cached.id === item.id ? merge(cached, item) : cached)));
  helpContentQuery.setData([kind, item.id], (cached) => merge(cached, item));
};

export const createHelpContent = async (kind: HelpContentKind, input: HelpContentInput) => {
  const result = await supportService.createContent(kind, input);
  const created = result.item;
  if (created) helpContentListQuery.setData([kind], (items) => [created, ...items.filter((cached) => cached.id !== created.id)]);
  helpContentListQuery.invalidate([kind]);
  return result;
};

/**
 * Saves the item, then makes sure it ends up published / unpublished as
 * chosen in the form (the update body's `publish` flag isn't documented to
 * unpublish, so the publish / unpublish endpoint is called if needed).
 */
export const updateHelpContent = async (kind: HelpContentKind, id: string, input: HelpContentInput) => {
  const result = await supportService.updateContent(kind, id, input);
  let saved = result.item ?? (await supportService.content(kind, id));
  const wanted = input.publish ? "published" : "draft";
  if (saved.status !== wanted) {
    const toggled = await supportService.setContentPublished(kind, id, input.publish);
    saved = toggled.item ?? { ...saved, status: wanted };
  }
  applyContent(kind, saved);
  return { ...result, item: saved };
};

export const setHelpContentPublished = async (kind: HelpContentKind, item: AdminHelpContent, publish: boolean) => {
  const result = await supportService.setContentPublished(kind, item.id, publish);
  const now = new Date().toISOString();
  applyContent(
    kind,
    result.item ?? {
      ...item,
      status: publish ? "published" : "draft",
      updatedAt: now,
      publishedAt: publish ? now : item.publishedAt,
    },
  );
  if (!result.item) helpContentListQuery.invalidate([kind]);
  return result;
};

export const deleteHelpContent = async (kind: HelpContentKind, item: AdminHelpContent) => {
  const result = await supportService.removeContent(kind, item.id);
  helpContentListQuery.setData([kind], (items) => items.filter((cached) => cached.id !== item.id));
  helpContentQuery.remove([kind, item.id]);
  return result;
};
