import type { HelpContentKind, HelpContentStatus, TicketPriority, TicketStatus } from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

const toOptions = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ label, value }));

/** "pending_user" / "audience-rental" → "Pending User" / "Audience Rental". */
const humanize = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Label for a free-text category: a known label, else the value made readable. */
const labelFrom = (labels: Record<string, string>) => (value: string) =>
  value ? (labels[value.toLowerCase()] ?? humanize(value)) : "—";

/** Known options plus any other values found in the data (categories are free text in the API). */
const withExtras = (labels: Record<string, string>, values: string[]) => {
  const label = labelFrom(labels);
  const extras = [...new Set(values.filter((value) => value && !(value.toLowerCase() in labels)))].map((value) => ({
    label: label(value),
    value,
  }));
  return [...toOptions(labels), ...extras.sort((a, b) => a.label.localeCompare(b.label))];
};

// ---- Tickets ----

export const ticketStatusStyles: Record<TicketStatus, BadgeStyle> = {
  open: { label: "Open", variant: "primary" },
  in_progress: { label: "In Progress", variant: "info", className: "text-blue-700" },
  pending_user: { label: "Pending User", variant: "warning", className: "text-amber-700" },
  resolved: { label: "Resolved", variant: "success", className: "text-green-700" },
  closed: { label: "Closed", variant: "neutral" },
};

export const ticketPriorityStyles: Record<TicketPriority, BadgeStyle> = {
  low: { label: "Low", variant: "neutral", className: "text-gray-500" },
  normal: { label: "Normal", variant: "neutral" },
  high: { label: "High", variant: "warning", className: "text-amber-700" },
  urgent: { label: "Urgent", variant: "danger", className: "text-red-600" },
};

/** Categories the app's "Report a Problem" screen is known to send; others are shown as sent. */
const ticketCategoryLabels: Record<string, string> = {
  wallet: "Wallet",
  campaign: "Campaign",
  referral: "Referral",
  account: "Account",
  audience: "Audience",
  technical: "Technical Issue",
};

export const ticketCategoryLabel = labelFrom(ticketCategoryLabels);

const statusLabels = Object.fromEntries(
  Object.entries(ticketStatusStyles).map(([value, { label }]) => [value, label]),
) as Record<TicketStatus, string>;
const priorityLabels = Object.fromEntries(
  Object.entries(ticketPriorityStyles).map(([value, { label }]) => [value, label]),
) as Record<TicketPriority, string>;

export const ticketStatusOptions = toOptions(statusLabels);
export const ticketPriorityOptions = toOptions(priorityLabels);

export const ticketStatusFilterOptions = [{ label: "All Statuses", value: "all" }, ...ticketStatusOptions];
/** Filter options: the known categories plus any others found on the tickets. */
export const ticketCategoryFilterOptions = (categories: string[]) => [
  { label: "All Categories", value: "all" },
  ...withExtras(ticketCategoryLabels, categories),
];
export const ticketPriorityFilterOptions = [{ label: "All Priorities", value: "all" }, ...ticketPriorityOptions];

// ---- Help articles & FAQs ----

const helpCategoryLabels: Record<string, string> = {
  account: "Account",
  wallet: "Wallet",
  campaigns: "Campaigns",
  audience: "Audience",
  referrals: "Referrals",
  general: "General",
};

export const helpCategoryLabel = labelFrom(helpCategoryLabels);

/** Form options: the known categories, plus the item's current one if the API sent another. */
export const helpCategoryOptions = (current?: string) => withExtras(helpCategoryLabels, current ? [current] : []);

/** Filter options: the known categories plus any others found on the items. */
export const helpCategoryFilterOptions = (categories: string[]) => [
  { label: "All Categories", value: "all" },
  ...withExtras(helpCategoryLabels, categories),
];

export const helpStatusStyles: Record<HelpContentStatus, BadgeStyle> = {
  published: { label: "Published", variant: "success", className: "text-green-700" },
  draft: { label: "Unpublished", variant: "neutral" },
};

export const helpStatusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(helpStatusStyles).map(([value, { label }]) => ({ label, value })),
];

export const backToSupport = { label: "Back to Support", to: "/support" };

/** Wording and paths that differ between help articles and FAQs. */
export const helpContentKinds = {
  article: {
    path: "/support/articles",
    listTitle: "Help Articles",
    listDescription: "Manage support articles displayed in the Global Pride app.",
    itemLabel: "articles",
    column: "Article",
    searchPlaceholder: "Search title or summary",
    createLabel: "Create Article",
    createTitle: "Create Help Article",
    createDescription: "Create a support article for the Global Pride app.",
    editTitle: "Edit Help Article",
    editDescription: "Update this support article. Changes apply to the app when published.",
    createCrumb: "Create Article",
    editCrumb: "Edit Article",
    backLabel: "Back to Help Articles",
    detailsTitle: "Article Details",
    titleLabel: "Article Title",
    titlePlaceholder: "e.g. How to fund your wallet",
    bodyLabel: "Article Content",
    bodyDescription: "Use headings, paragraphs, lists and links to write clear support documentation.",
    bodyPlaceholder: "Write the article content…",
    statusNote: "Published articles are visible in the Global Pride app. Unpublished articles are hidden from users.",
    saveLabel: "Save Article",
    titleRequired: "Article title is required.",
    bodyRequired: "Article content is required.",
    emptyTitle: "No articles found",
    noneYetTitle: "No help articles yet",
    noneYetText: "Articles you create appear here, and in the app's Help & Support screen once published.",
    notFoundTitle: "Article not found",
    deleteTitle: "Delete article?",
    deleteText: "This will permanently remove this article. If you only want to hide it from the app, unpublish it instead.",
    previewEyebrow: undefined,
  },
  faq: {
    path: "/support/faqs",
    listTitle: "FAQs",
    listDescription: "Manage frequently asked questions and answers displayed in the Global Pride app.",
    itemLabel: "FAQs",
    column: "Question",
    searchPlaceholder: "Search question",
    createLabel: "Create FAQ",
    createTitle: "Create FAQ",
    createDescription: "Create a frequently asked question for the Global Pride app.",
    editTitle: "Edit FAQ",
    editDescription: "Update this question and answer. Changes apply to the app when published.",
    createCrumb: "Create FAQ",
    editCrumb: "Edit FAQ",
    backLabel: "Back to FAQs",
    detailsTitle: "FAQ Details",
    titleLabel: "Question",
    titlePlaceholder: "e.g. How do I fund my wallet?",
    bodyLabel: "Answer",
    bodyDescription: "Keep answers short and clear. Use lists or links where helpful.",
    bodyPlaceholder: "Write the answer…",
    statusNote: "Published FAQs are visible in the Global Pride app. Unpublished FAQs are hidden from users.",
    saveLabel: "Save FAQ",
    titleRequired: "Question is required.",
    bodyRequired: "Answer is required.",
    emptyTitle: "No FAQs found",
    noneYetTitle: "No FAQs yet",
    noneYetText: "FAQs you create appear here, and in the app's Help & Support screen once published.",
    notFoundTitle: "FAQ not found",
    deleteTitle: "Delete FAQ?",
    deleteText: "This will permanently remove this FAQ. If you only want to hide it from the app, unpublish it instead.",
    previewEyebrow: "FAQs",
  },
} satisfies Record<HelpContentKind, Record<string, string | undefined>>;
