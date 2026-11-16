import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { mutate } from "@/api/utils/mutate";
import { isRaw, key, list, nested, num as count, pick, text, unwrapItem, type Raw } from "@/api/utils/raw";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import type {
  FaqPayload,
  HelpArticlePayload,
  TicketMessagePayload,
  TicketPriorityPayload,
  TicketStatusPayload,
} from "@/api/types/request";
import type {
  AdminHelpContent,
  AdminResponse,
  AdminSupportTicket,
  AdminSupportTicketDetails,
  AdminTicketSummary,
  HelpContentKind,
  HelpContentStatus,
  PagedResult,
  TicketMessage,
  TicketNote,
  TicketPriority,
  TicketStatus,
} from "@/api/types/response";

// Swagger documents the request bodies but no response body for the admin
// support endpoints, so rows are read defensively (see utils/raw), starting
// with the names the mobile app's support DTOs use (`reference`,
// `issueCategory`, `from`, `summary`, `content`, `question`, `answerHtml`).

// ---- Tickets ----

const TICKET_STATUSES: TicketStatus[] = ["open", "in_progress", "pending_user", "resolved", "closed"];
const TICKET_PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

const toTicketStatus = (value: unknown): TicketStatus =>
  TICKET_STATUSES.find((status) => key(status) === key(value)) ?? "open";

const toTicketPriority = (value: unknown): TicketPriority =>
  TICKET_PRIORITIES.find((priority) => key(priority) === key(value)) ?? "normal";

const ADMIN_AUTHORS = new Set(["support", "admin", "administrator", "staff", "agent", "team"]);
const INTERNAL_TYPES = new Set(["note", "internal", "internalnote"]);

const toTicket = (raw: Raw): AdminSupportTicket => {
  const user = nested(raw, "user", "customer", "reporter");
  const id = text(raw, "id", "ticketId", "guid") ?? "";
  const createdAt = text(raw, "createdAt", "dateCreated", "submittedAt") ?? "";

  return {
    id,
    reference: text(raw, "reference", "ticketReference", "ticketNumber", "code") ?? id,
    userId: text(raw, "userId", "customerId") ?? text(user, "id", "userId"),
    userName:
      text(raw, "userName", "userFullName", "fullName", "customerName", "name") ??
      text(user, "fullName", "name", "displayName") ??
      text(raw, "userEmail", "email") ??
      text(user, "email") ??
      "Unknown user",
    userEmail: text(raw, "userEmail", "email") ?? text(user, "email"),
    subject: text(raw, "subject", "title") ?? "(No subject)",
    category: text(raw, "issueCategory", "category") ?? "",
    priority: toTicketPriority(pick(raw, "priority")),
    status: toTicketStatus(pick(raw, "status")),
    createdAt,
    updatedAt: text(raw, "updatedAt", "lastActivityAt", "lastUpdatedAt", "modifiedAt") ?? createdAt,
  };
};

const isInternal = (raw: Raw) =>
  pick(raw, "isInternal", "internal", "isNote") === true || INTERNAL_TYPES.has(key(pick(raw, "type", "kind", "visibility")));

const toMessage = (raw: Raw, index: number, userName: string): TicketMessage => {
  const from = key(pick(raw, "from", "author", "authorType", "senderType", "sender", "role"));
  const fromAdmin = ADMIN_AUTHORS.has(from) || pick(raw, "isAdmin", "fromAdmin", "isStaff") === true;
  return {
    id: text(raw, "id", "messageId") ?? `m${index}`,
    author: fromAdmin ? "admin" : "user",
    authorName:
      text(raw, "authorName", "senderName", "adminName", "createdByName", "fullName") ??
      (fromAdmin ? "Support Team" : userName),
    body: text(raw, "body", "message", "text", "content") ?? "",
    createdAt: text(raw, "createdAt", "sentAt", "date") ?? "",
  };
};

const toNote = (raw: Raw, index: number): TicketNote => ({
  id: text(raw, "id", "noteId") ?? `n${index}`,
  authorName: text(raw, "authorName", "adminName", "createdByName", "createdBy", "author") ?? "Administrator",
  body: text(raw, "body", "message", "note", "text", "content") ?? "",
  createdAt: text(raw, "createdAt", "date") ?? "",
});

const toTicketDetails = (raw: Raw): AdminSupportTicketDetails => {
  const ticket = toTicket(raw);
  const conversation = list(raw, "messages", "conversation", "replies");

  return {
    ...ticket,
    description: text(raw, "description", "message", "body"),
    messages: conversation
      .filter((item) => !isInternal(item))
      .map((item, index) => toMessage(item, index, ticket.userName)),
    notes: [...list(raw, "notes", "internalNotes"), ...conversation.filter(isInternal)].map(toNote),
  };
};

const toSummary = (result: unknown): AdminTicketSummary => {
  const raw = isRaw(result) ? { ...result, ...nested(result, "byStatus", "statusCounts", "counts") } : {};
  return {
    total: count(raw, "total", "totalTickets", "all"),
    open: count(raw, "open", "openTickets"),
    inProgress: count(raw, "inProgress", "in_progress", "inProgressTickets"),
    pendingUser: count(raw, "pendingUser", "pending_user", "pendingUserTickets"),
    resolved: count(raw, "resolved", "resolvedTickets"),
    closed: count(raw, "closed", "closedTickets"),
  };
};

const ticketPath = (id: string) => `/admin/support/tickets/${encodeURIComponent(id)}`;

/** A ticket mutation's `result` read as the updated ticket, if it is one (it may be empty or just a message). */
const toTicketOrNull = (result: unknown) => {
  const raw = unwrapItem(result, "ticket");
  return raw && pick(raw, "id", "reference") != null && pick(raw, "subject", "status") != null
    ? toTicketDetails(raw)
    : null;
};

// ---- Help articles & FAQs ----

const contentPath: Record<HelpContentKind, string> = {
  article: "/admin/support/articles",
  faq: "/admin/support/faqs",
};

const toContentStatus = (raw: Raw): HelpContentStatus => {
  const status = key(pick(raw, "status"));
  if (status === "published" || status === "live") return "published";
  if (status) return "draft";
  const flag = pick(raw, "isPublished", "published");
  if (typeof flag === "boolean") return flag ? "published" : "draft";
  return text(raw, "publishedAt") ? "published" : "draft";
};

const toContent = (kind: HelpContentKind, raw: Raw): AdminHelpContent => {
  const publishedAt = text(raw, "publishedAt");
  const body =
    kind === "article" ? text(raw, "content", "contentHtml", "body") : text(raw, "answerHtml", "answer", "body");

  return {
    id: text(raw, "id", "articleId", "faqId") ?? "",
    title: (kind === "article" ? text(raw, "title") : text(raw, "question", "title")) ?? "Untitled",
    category: text(raw, "category") ?? "",
    summary: text(raw, "summary", "excerpt") ?? "",
    status: toContentStatus(raw),
    body,
    updatedAt: text(raw, "updatedAt", "lastUpdatedAt", "modifiedAt") ?? publishedAt ?? text(raw, "createdAt"),
    publishedAt,
  };
};

const contentWrappers = (kind: HelpContentKind) => (kind === "article" ? ["article"] : ["faq"]);

/** A content mutation's `result` read as the saved item, if it is one; otherwise its id, if it's just an id. */
const toContentResult = (kind: HelpContentKind, result: unknown) => {
  const raw = unwrapItem(result, ...contentWrappers(kind));
  const item = raw && pick(raw, "id") != null && pick(raw, "title", "question", "status") != null ? toContent(kind, raw) : null;
  const id = item?.id ?? (typeof result === "string" ? result : raw ? text(raw, "id") : null);
  return { item, id };
};

const toPayload = (
  kind: HelpContentKind,
  input: { title: string; category: string; summary: string; body: string; publish: boolean },
): HelpArticlePayload | FaqPayload =>
  kind === "article"
    ? { title: input.title, category: input.category, summary: input.summary, content: input.body, publish: input.publish }
    : { category: input.category, question: input.title, answer: input.body, publish: input.publish };

export type HelpContentInput = Parameters<typeof toPayload>[1];

const noun: Record<HelpContentKind, string> = { article: "article", faq: "FAQ" };

/** Admin Support (`/admin/support`). Every call rejects with a normalized `ApiError`. */
export const supportService = {
  ticketSummary: async () => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/support/tickets/summary", { useAuth: true });
    return toSummary(unwrap(data, "We couldn't load the ticket summary."));
  },

  /** Every ticket (all pages). Search, filters and paging are then done in the browser. */
  listTickets: async (): Promise<AdminSupportTicket[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>("/admin/support/tickets", {
        params: { page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load support tickets.");
    });
    return pages.flatMap((page) => page.items).filter(isRaw).map(toTicket);
  },

  /** `id` is the ticket reference (TKT-…) or its GUID. */
  ticket: async (id: string): Promise<AdminSupportTicketDetails> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(ticketPath(id), { useAuth: true });
    return toTicketDetails(unwrapItem(unwrap(data, "We couldn't load this ticket."), "ticket") ?? {});
  },

  setTicketStatus: async (id: string, status: TicketStatus) => {
    const payload: TicketStatusPayload = { status };
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>(`${ticketPath(id)}/status`, payload, { useAuth: true }),
      "We couldn't change the ticket status.",
    );
    return { ticket: toTicketOrNull(result), message };
  },

  setTicketPriority: async (id: string, priority: TicketPriority) => {
    const payload: TicketPriorityPayload = { priority };
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>(`${ticketPath(id)}/priority`, payload, { useAuth: true }),
      "We couldn't change the ticket priority.",
    );
    return { ticket: toTicketOrNull(result), message };
  },

  /** A reply the user sees (in the app, plus a notification). Moves the ticket to Pending User. */
  replyToTicket: async (id: string, message: string) => {
    const payload: TicketMessagePayload = { message };
    const response = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${ticketPath(id)}/reply`, payload, { useAuth: true }),
      "We couldn't send this reply.",
    );
    return { ticket: toTicketOrNull(response.result), message: response.message };
  },

  /** An internal note: visible to administrators only. */
  addTicketNote: async (id: string, message: string) => {
    const payload: TicketMessagePayload = { message };
    const response = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${ticketPath(id)}/notes`, payload, { useAuth: true }),
      "We couldn't add this note.",
    );
    return { ticket: toTicketOrNull(response.result), message: response.message };
  },

  /** Every article or FAQ, published and draft (all pages). */
  listContent: async (kind: HelpContentKind): Promise<AdminHelpContent[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>(contentPath[kind], {
        params: { status: "all", page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, `We couldn't load ${kind === "article" ? "help articles" : "FAQs"}.`);
    });
    return pages
      .flatMap((page) => page.items)
      .filter(isRaw)
      .map((raw) => toContent(kind, raw));
  },

  /** `id` is the GUID. */
  content: async (kind: HelpContentKind, id: string): Promise<AdminHelpContent> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(`${contentPath[kind]}/${encodeURIComponent(id)}`, {
      useAuth: true,
    });
    const raw = unwrapItem(unwrap(data, `We couldn't load this ${noun[kind]}.`), ...contentWrappers(kind));
    return toContent(kind, raw ?? {});
  },

  createContent: async (kind: HelpContentKind, input: HelpContentInput) => {
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(contentPath[kind], toPayload(kind, input), { useAuth: true }),
      `We couldn't create this ${noun[kind]}.`,
    );
    return { ...toContentResult(kind, result), message };
  },

  updateContent: async (kind: HelpContentKind, id: string, input: HelpContentInput) => {
    const { result, message } = await mutate(
      apiClient.put<AdminResponse<unknown>>(`${contentPath[kind]}/${encodeURIComponent(id)}`, toPayload(kind, input), {
        useAuth: true,
      }),
      `We couldn't update this ${noun[kind]}.`,
    );
    return { ...toContentResult(kind, result), message };
  },

  removeContent: async (kind: HelpContentKind, id: string) => {
    const { message } = await mutate(
      apiClient.delete<AdminResponse<unknown>>(`${contentPath[kind]}/${encodeURIComponent(id)}`, { useAuth: true }),
      `We couldn't delete this ${noun[kind]}.`,
    );
    return { message };
  },

  /** Publishes (`publish: true`) or unpublishes the item. */
  setContentPublished: async (kind: HelpContentKind, id: string, publish: boolean) => {
    const action = publish ? "publish" : "unpublish";
    const { result, message } = await mutate(
      apiClient.post<AdminResponse<unknown>>(`${contentPath[kind]}/${encodeURIComponent(id)}/${action}`, null, {
        useAuth: true,
      }),
      `We couldn't ${action} this ${noun[kind]}.`,
    );
    return { ...toContentResult(kind, result), message };
  },
};
