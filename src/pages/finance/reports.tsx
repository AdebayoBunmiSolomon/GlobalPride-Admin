import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ChartLine,
  CirclePlus,
  CircleX,
  Clock,
  FileText,
  Gift,
  Image,
  Landmark,
  MessageSquare,
  Percent,
  ReceiptText,
  Undo2,
  UserCheck,
  Users,
  UserStar,
  Wallet,
} from "lucide-react";

import { serviceLabel, type FinanceReportName } from "@/api/services/finance";
import type { FinanceReportRow, FinanceServiceRevenue, FinanceSummary } from "@/api/types/response";
import { WalletStatusBadge } from "@/pages/wallets/WalletBadges";
import { formatCompactNaira, formatDate, formatNaira, parseApiDate } from "@/utils/format";
import type { Tone } from "@/utils/tones";

type Icon = ComponentType<{ className?: string }>;

const money = (value: number | null) => (value === null ? "—" : formatCompactNaira(value));
const count = (value: number | null) => (value === null ? "—" : value.toLocaleString());

/** Gross revenue, or the sum of the per-service figures when the API sends no total. */
export const grossRevenue = (summary: FinanceSummary) =>
  summary.grossRevenue ??
  (summary.revenueByService.length ? summary.revenueByService.reduce((sum, item) => sum + item.amount, 0) : null);

/** VAT on a service amount at the summary's rate, when the API didn't send it. */
export const serviceVat = (summary: FinanceSummary, item: FinanceServiceRevenue) =>
  item.vat ?? (summary.vatRate === null ? null : Math.round((item.amount * summary.vatRate) / 100));

// ── Report definitions ─────────────────────────────────────────────────────

export interface ReportColumn {
  header: string;
  cell: (row: FinanceReportRow) => ReactNode;
}

export interface ReportSummaryItem {
  label: string;
  value: string;
  note: string;
  icon: Icon;
  tone?: Tone;
}

export interface ReportBreakdown {
  title: string;
  description: string;
  columns: string[];
  rows: ReactNode[][];
  total: ReactNode[];
}

export interface FinanceReport {
  /** URL slug: `/finance/reports/:id`. */
  id: string;
  /** The API's report name. */
  api: FinanceReportName;
  title: string;
  description: string;
  icon: Icon;
  summaryTitle: string;
  summary: (summary: FinanceSummary) => ReportSummaryItem[];
  breakdown?: (summary: FinanceSummary) => ReportBreakdown | null;
  activityTitle: string;
  activityDescription: string;
  /** Noun for pagination and empty state, e.g. "revenue transactions". */
  itemLabel: string;
  footnote: string;
  columns: ReportColumn[];
}

const textLink = (to: string, label: string) => (
  <Link to={to} className="font-medium text-primary hover:underline">
    {label}
  </Link>
);

const naira = (value: number | null) => (value === null ? "—" : formatNaira(value));

const columns = {
  reference: (header = "Transaction"): ReportColumn => ({ header, cell: (row) => row.reference }),
  user: {
    header: "User",
    cell: (row) => (row.userId ? textLink(`/users/${encodeURIComponent(row.userId)}`, row.userName) : row.userName),
  } satisfies ReportColumn,
  service: { header: "Service", cell: (row) => (row.service ? serviceLabel(row.service) : "—") } satisfies ReportColumn,
  amount: (header: string): ReportColumn => ({ header, cell: (row) => naira(row.amount) }),
  date: {
    header: "Date",
    cell: (row) => (row.createdAt ? formatDate(parseApiDate(row.createdAt)) : "—"),
  } satisfies ReportColumn,
  status: {
    header: "Status",
    cell: (row) => (row.status ? <WalletStatusBadge status={row.status} /> : "—"),
  } satisfies ReportColumn,
};

const serviceCards: { match: string; label: string; icon: Icon; tone?: Tone }[] = [
  { match: "sms", label: "SMS Campaign Revenue", icon: MessageSquare },
  { match: "image", label: "Image Campaign Revenue", icon: Image, tone: "blue" },
  { match: "audience", label: "Audience Rental Revenue", icon: Users, tone: "amber" },
];

export const financeReports: FinanceReport[] = [
  {
    id: "revenue",
    api: "revenue",
    title: "Revenue Report",
    description: "Revenue generated from SMS, Image campaigns and Audience Rental.",
    icon: ChartLine,
    summaryTitle: "Report Summary",
    summary: (summary) => [
      {
        label: "Gross Revenue",
        value: money(grossRevenue(summary)),
        note: "Total recognized service revenue before VAT.",
        icon: ChartLine,
      },
      ...summary.revenueByService.map((item): ReportSummaryItem => {
        const card = serviceCards.find((entry) => item.service.toLowerCase().includes(entry.match));
        return {
          label: card?.label ?? `${item.label} Revenue`,
          value: formatCompactNaira(item.amount),
          note: item.transactions === null ? "Charges excluding VAT." : `${item.transactions.toLocaleString()} transactions, excluding VAT.`,
          icon: card?.icon ?? ChartLine,
          tone: card?.tone ?? "gray",
        };
      }),
    ],
    breakdown: (summary) =>
      summary.revenueByService.length === 0
        ? null
        : {
            title: "Revenue Breakdown",
            description: "Revenue generated by active platform services.",
            columns: ["Revenue Source", "Transactions", "Revenue"],
            rows: summary.revenueByService.map((item) => [item.label, count(item.transactions), formatCompactNaira(item.amount)]),
            total: [
              "Gross Revenue",
              summary.revenueByService.every((item) => item.transactions !== null)
                ? summary.revenueByService.reduce((sum, item) => sum + (item.transactions ?? 0), 0).toLocaleString()
                : "—",
              money(grossRevenue(summary)),
            ],
          },
    activityTitle: "Revenue Activity",
    activityDescription: "Successfully recognized revenue for the selected period.",
    itemLabel: "revenue transactions",
    footnote:
      "Wallet funding, referral bonuses, VAT and failed transactions are excluded from revenue. Voice and Video campaigns are coming soon.",
    columns: [columns.reference(), columns.user, columns.service, columns.amount("Service Amount"), columns.date, columns.status],
  },
  {
    id: "vat",
    api: "vat",
    title: "VAT Report",
    description: "VAT charged on taxable platform services.",
    icon: Percent,
    summaryTitle: "VAT Summary",
    summary: (summary) => [
      {
        label: "VAT Rate",
        value: summary.vatRate === null ? "—" : `${summary.vatRate}%`,
        note: "Applied to taxable platform services.",
        icon: Percent,
      },
      {
        label: "Taxable Service Amount",
        value: money(grossRevenue(summary)),
        note: "Service charge before VAT.",
        icon: Landmark,
        tone: "blue",
      },
      {
        label: "VAT Collected",
        value: money(summary.vatCollected),
        note: "Tracked separately from platform revenue.",
        icon: ReceiptText,
        tone: "gray",
      },
    ],
    breakdown: (summary) =>
      summary.revenueByService.length === 0
        ? null
        : {
            title: "VAT by Service",
            description: "Taxable amount and VAT for each active service.",
            columns: ["Service", "Taxable Amount", "VAT"],
            rows: summary.revenueByService.map((item) => [
              item.label,
              formatCompactNaira(item.amount),
              money(serviceVat(summary, item)),
            ]),
            total: ["Total", money(grossRevenue(summary)), money(summary.vatCollected)],
          },
    activityTitle: "VAT Activity",
    activityDescription: "Taxable transactions where VAT was successfully collected.",
    itemLabel: "taxable transactions",
    footnote:
      "Failed charges are never counted as collected VAT. VAT remittance is not tracked by the platform, so no remitted or pending figures are shown.",
    columns: [
      columns.reference(),
      columns.user,
      columns.service,
      columns.amount("Service Amount"),
      { header: "VAT", cell: (row) => naira(row.vat) },
      {
        header: "Total Customer Charge",
        cell: (row) => <span className="font-semibold text-gray-900">{naira(row.total)}</span>,
      },
      columns.date,
      columns.status,
    ],
  },
  {
    id: "wallet-funding",
    api: "funding",
    title: "Wallet Funding Report",
    description: "Total wallet funding and funding activity for the selected period.",
    icon: Wallet,
    summaryTitle: "Report Summary",
    summary: (summary) => [
      {
        label: "Successful Wallet Funding",
        value: money(summary.funding),
        note: "Funding successfully credited to wallets.",
        icon: CirclePlus,
      },
      {
        label: "Funding Transactions",
        value: count(summary.fundingCount),
        note: "Funding attempts in the period.",
        icon: ArrowLeftRight,
      },
      {
        label: "Pending Funding",
        value: money(summary.fundingPending),
        note: "Awaiting payment confirmation.",
        icon: Clock,
        tone: "amber",
      },
      {
        label: "Failed Funding",
        value: money(summary.fundingFailed),
        note: "Payments that did not complete.",
        icon: CircleX,
        tone: "red",
      },
    ],
    activityTitle: "Funding Activity",
    activityDescription: "Wallet funding transactions for the selected period.",
    itemLabel: "funding transactions",
    footnote:
      "Wallet funding is money added to a user's wallet and is not platform revenue. Individual wallet impact is available in Wallet Management.",
    columns: [
      columns.reference(),
      columns.user,
      columns.amount("Amount"),
      columns.status,
      { header: "Payment Reference", cell: (row) => row.paymentReference ?? "—" },
      columns.date,
    ],
  },
  {
    id: "referral-bonuses",
    api: "referral-bonuses",
    title: "Referral Bonus Report",
    description: "Successful referrals and referral bonuses paid during the selected period.",
    icon: Gift,
    summaryTitle: "Report Summary",
    summary: (summary) => [
      {
        label: "Successful Referrals",
        value: count(summary.referralCount),
        note: "Referrals that earned a bonus in the period.",
        icon: UserCheck,
      },
      {
        label: "Referral Bonuses Paid",
        value: money(summary.referralBonuses),
        note: "Credits issued for successful referrals.",
        icon: Gift,
        tone: "blue",
      },
      {
        label: "Users Rewarded",
        value: count(summary.usersRewarded),
        note: "Distinct users who received a bonus.",
        icon: UserStar,
        tone: "gray",
      },
    ],
    activityTitle: "Referral Bonus Activity",
    activityDescription: "Referral bonuses issued during the selected period.",
    itemLabel: "referral bonus records",
    footnote:
      "Referral bonuses are wallet credits issued through the referral programme and are not platform revenue. Referral relationships and qualification rules live in Referral Management.",
    columns: [columns.reference(), columns.user, columns.amount("Bonus Amount"), columns.date, columns.status],
  },
  {
    id: "refunds",
    api: "refunds",
    title: "Refund Report",
    description: "Refund amounts and refund activity for the selected period.",
    icon: Undo2,
    summaryTitle: "Report Summary",
    summary: (summary) => [
      {
        label: "Total Refunds",
        value: money(summary.refunds),
        note: "Refund amount returned to users.",
        icon: Undo2,
      },
      {
        label: "Number of Refunds",
        value: count(summary.refundCount),
        note: "Refunds processed in the period.",
        icon: FileText,
        tone: "blue",
      },
    ],
    activityTitle: "Refund Activity",
    activityDescription: "Refunds processed during the selected period.",
    itemLabel: "refunds",
    footnote: "Refunds are returned to the user and are not new revenue.",
    columns: [
      columns.reference("Refund Transaction"),
      columns.user,
      {
        header: "Original Transaction",
        cell: (row) =>
          row.originalReference
            ? textLink(`/wallets/transactions/${encodeURIComponent(row.originalReference)}`, row.originalReference)
            : "—",
      },
      columns.amount("Refund Amount"),
      columns.date,
      columns.status,
    ],
  },
];

export const getFinanceReport = (id?: string) => financeReports.find((report) => report.id === id);
