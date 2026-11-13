import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ChartLine,
  CircleCheck,
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

import { financeStats, mockWalletLedger } from "@/data/mock";
import { SignedAmount, TransactionStatusBadge } from "@/pages/wallets/WalletBadges";
import { transactionStatusStyles, transactionTypes } from "@/pages/wallets/walletOptions";
import type { WalletLedgerEntry, WalletTransactionType } from "@/types/wallet";
import { downloadCsv } from "@/utils/csv";
import { getDateFrom } from "@/utils/dateRange";
import { formatCompactNaira, formatDate, formatNaira } from "@/utils/format";
import type { Tone } from "@/utils/tones";

type Icon = ComponentType<{ className?: string }>;

// ── Headline figures ───────────────────────────────────────────────────────

const { vatRate } = financeStats;

const revenueLabels: Partial<Record<WalletTransactionType, string>> = {
  sms_campaign: "SMS Campaigns",
  image_campaign: "Image Campaigns",
  audience_rental: "Audience Rental",
};

const vatOn = (amount: number) => Math.round((amount * vatRate) / 100);

export const revenueBreakdown = financeStats.revenue.map((source) => ({
  ...source,
  label: revenueLabels[source.type] ?? transactionTypes[source.type].label,
  vat: vatOn(source.amount),
}));

export const revenueTotals = {
  amount: revenueBreakdown.reduce((sum, source) => sum + source.amount, 0),
  transactions: revenueBreakdown.reduce((sum, source) => sum + source.transactions, 0),
  vat: revenueBreakdown.reduce((sum, source) => sum + source.vat, 0),
};

/** A ledger charge (which includes VAT) split into service amount and VAT. */
export const splitCharge = (transaction: WalletLedgerEntry) => {
  const total = Math.abs(transaction.amount);
  const service = Math.round((total * 100) / (100 + vatRate));
  return { service, vat: total - service, total };
};

// ── Report definitions ─────────────────────────────────────────────────────

export interface ReportColumn {
  header: string;
  cell: (transaction: WalletLedgerEntry) => ReactNode;
  csv: (transaction: WalletLedgerEntry) => string | number;
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
  title: string;
  description: string;
  icon: Icon;
  summaryTitle: string;
  summary: ReportSummaryItem[];
  breakdown?: ReportBreakdown;
  activityTitle: string;
  activityDescription: string;
  /** Noun for pagination and empty state, e.g. "revenue transactions". */
  itemLabel: string;
  footnote: string;
  includes: (transaction: WalletLedgerEntry) => boolean;
  columns: ReportColumn[];
}

const textLink = (to: string, label: string) => (
  <Link to={to} className="font-medium text-primary hover:underline">
    {label}
  </Link>
);

const columns = {
  id: (header = "Transaction ID"): ReportColumn => ({
    header,
    cell: (transaction) => transaction.id,
    csv: (transaction) => transaction.id,
  }),
  user: {
    header: "User",
    cell: (transaction) => textLink(`/users/${transaction.userId}`, transaction.userName),
    csv: (transaction) => transaction.userName,
  } satisfies ReportColumn,
  service: {
    header: "Service",
    cell: (transaction) => transactionTypes[transaction.type].label,
    csv: (transaction) => transactionTypes[transaction.type].label,
  } satisfies ReportColumn,
  serviceAmount: {
    header: "Service Amount",
    cell: (transaction) => formatNaira(splitCharge(transaction).service),
    csv: (transaction) => splitCharge(transaction).service,
  } satisfies ReportColumn,
  credit: (header: string): ReportColumn => ({
    header,
    cell: (transaction) => <SignedAmount amount={transaction.amount} />,
    csv: (transaction) => transaction.amount,
  }),
  date: {
    header: "Date",
    cell: (transaction) => formatDate(transaction.createdAt),
    csv: (transaction) => transaction.createdAt,
  } satisfies ReportColumn,
  status: {
    header: "Status",
    cell: (transaction) => <TransactionStatusBadge status={transaction.status} />,
    csv: (transaction) => transactionStatusStyles[transaction.status].label,
  } satisfies ReportColumn,
};

const isRevenue = (transaction: WalletLedgerEntry) =>
  transaction.status === "successful" && transaction.type in revenueLabels;

const revenueCards: Record<string, Omit<ReportSummaryItem, "value">> = {
  sms_campaign: { label: "SMS Campaign Revenue", note: "Campaign charges excluding VAT.", icon: MessageSquare },
  image_campaign: { label: "Image Campaign Revenue", note: "Campaign charges excluding VAT.", icon: Image, tone: "blue" },
  audience_rental: { label: "Audience Rental Revenue", note: "Audience rental charges excluding VAT.", icon: Users, tone: "amber" },
};

const revenueRows = revenueBreakdown.map((source) => [
  source.label,
  source.transactions.toLocaleString(),
  formatCompactNaira(source.amount),
]);

export const financeReports: FinanceReport[] = [
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Revenue generated from SMS, Image campaigns and Audience Rental.",
    icon: ChartLine,
    summaryTitle: "Report Summary",
    summary: [
      {
        label: "Gross Revenue",
        value: formatCompactNaira(revenueTotals.amount),
        note: "Total recognized service revenue before VAT.",
        icon: ChartLine,
      },
      ...revenueBreakdown.map(
        (source): ReportSummaryItem => ({
          ...revenueCards[source.type],
          value: formatCompactNaira(source.amount),
        }),
      ),
    ],
    breakdown: {
      title: "Revenue Breakdown",
      description: "Revenue generated by active platform services.",
      columns: ["Revenue Source", "Transactions", "Revenue"],
      rows: revenueRows,
      total: ["Gross Revenue", revenueTotals.transactions.toLocaleString(), formatCompactNaira(revenueTotals.amount)],
    },
    activityTitle: "Revenue Activity",
    activityDescription: "Successfully recognized revenue for the selected period.",
    itemLabel: "revenue transactions",
    footnote:
      "Wallet funding, referral bonuses, VAT and failed transactions are excluded from revenue. Voice and Video campaigns are coming soon.",
    includes: isRevenue,
    columns: [columns.id(), columns.user, columns.service, columns.serviceAmount, columns.date, columns.status],
  },
  {
    id: "vat",
    title: "VAT Report",
    description: "VAT charged on taxable platform services.",
    icon: Percent,
    summaryTitle: "VAT Summary",
    summary: [
      { label: "VAT Rate", value: `${vatRate}%`, note: "Applied to taxable platform services.", icon: Percent },
      {
        label: "Taxable Service Amount",
        value: formatCompactNaira(revenueTotals.amount),
        note: "Service charge before VAT.",
        icon: Landmark,
        tone: "blue",
      },
      {
        label: "VAT Collected",
        value: formatCompactNaira(revenueTotals.vat),
        note: "Tracked separately from platform revenue.",
        icon: ReceiptText,
        tone: "gray",
      },
    ],
    breakdown: {
      title: "VAT by Service",
      description: "Taxable amount and VAT for each active service.",
      columns: ["Service", "Taxable Amount", "VAT"],
      rows: revenueBreakdown.map((source) => [
        source.label,
        formatCompactNaira(source.amount),
        formatCompactNaira(source.vat),
      ]),
      total: ["Total", formatCompactNaira(revenueTotals.amount), formatCompactNaira(revenueTotals.vat)],
    },
    activityTitle: "VAT Activity",
    activityDescription: "Taxable transactions where VAT was successfully collected.",
    itemLabel: "taxable transactions",
    footnote:
      "Failed charges are never counted as collected VAT. VAT remittance is not tracked by the platform, so no remitted or pending figures are shown.",
    includes: isRevenue,
    columns: [
      columns.id(),
      columns.user,
      columns.service,
      columns.serviceAmount,
      {
        header: "VAT",
        cell: (transaction) => formatNaira(splitCharge(transaction).vat),
        csv: (transaction) => splitCharge(transaction).vat,
      },
      {
        header: "Total Customer Charge",
        cell: (transaction) => (
          <span className="font-semibold text-gray-900">{formatNaira(splitCharge(transaction).total)}</span>
        ),
        csv: (transaction) => splitCharge(transaction).total,
      },
      columns.date,
      columns.status,
    ],
  },
  {
    id: "wallet-funding",
    title: "Wallet Funding Report",
    description: "Total wallet funding and funding activity for the selected period.",
    icon: Wallet,
    summaryTitle: "Report Summary",
    summary: [
      {
        label: "Successful Wallet Funding",
        value: formatCompactNaira(financeStats.walletFunding.successful),
        note: "Funding successfully credited to wallets.",
        icon: CirclePlus,
      },
      {
        label: "Funding Transactions",
        value: financeStats.walletFunding.transactions.toLocaleString(),
        note: "All funding attempts in the period.",
        icon: ArrowLeftRight,
      },
      {
        label: "Pending Funding",
        value: formatCompactNaira(financeStats.walletFunding.pending),
        note: "Awaiting payment confirmation.",
        icon: Clock,
        tone: "amber",
      },
      {
        label: "Failed Funding",
        value: formatCompactNaira(financeStats.walletFunding.failed),
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
    includes: (transaction) => transaction.type === "wallet_funding",
    columns: [
      columns.id(),
      columns.user,
      columns.credit("Amount"),
      columns.status,
      {
        header: "Payment Reference",
        cell: (transaction) => transaction.payment?.reference ?? "—",
        csv: (transaction) => transaction.payment?.reference ?? "",
      },
      columns.date,
    ],
  },
  {
    id: "referral-bonuses",
    title: "Referral Bonus Report",
    description: "Successful referrals and referral bonuses paid during the selected period.",
    icon: Gift,
    summaryTitle: "Report Summary",
    summary: [
      {
        label: "Successful Referrals",
        value: financeStats.referrals.successful.toLocaleString(),
        note: "Referrals that qualified in the period.",
        icon: UserCheck,
      },
      {
        label: "Referral Bonuses Paid",
        value: formatCompactNaira(financeStats.referrals.bonusesPaid),
        note: "Credits issued for successful referrals.",
        icon: Gift,
        tone: "blue",
      },
      {
        label: "Users Rewarded",
        value: financeStats.referrals.usersRewarded.toLocaleString(),
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
    includes: (transaction) => transaction.type === "referral_bonus",
    columns: [
      columns.id(),
      columns.user,
      // A bonus is only issued once its referral qualifies, so every row is a successful referral.
      { header: "Referral Status", cell: () => "Successful Referral", csv: () => "Successful Referral" },
      columns.credit("Bonus Amount"),
      columns.date,
      columns.status,
    ],
  },
  {
    id: "refunds",
    title: "Refund Report",
    description: "Refund amounts and refund activity for the selected period.",
    icon: Undo2,
    summaryTitle: "Report Summary",
    summary: [
      {
        label: "Total Refunds",
        value: formatCompactNaira(financeStats.refunds.total),
        note: "Refund amount returned to users.",
        icon: Undo2,
      },
      {
        label: "Number of Refunds",
        value: financeStats.refunds.count.toLocaleString(),
        note: "Refunds processed in the period.",
        icon: FileText,
        tone: "blue",
      },
      {
        label: "Successful Refunds",
        value: financeStats.refunds.successful.toLocaleString(),
        note: "All processed refunds completed.",
        icon: CircleCheck,
        tone: "gray",
      },
    ],
    activityTitle: "Refund Activity",
    activityDescription: "Refunds processed during the selected period.",
    itemLabel: "refunds",
    footnote:
      "Refunds are returned to the user and are not new revenue. Pending refunds are not currently tracked by the platform.",
    includes: (transaction) => transaction.type === "refund",
    columns: [
      columns.id("Refund Transaction"),
      columns.user,
      {
        header: "Original Transaction",
        cell: (transaction) =>
          transaction.originalTransactionId
            ? textLink(`/wallets/transactions/${transaction.originalTransactionId}`, transaction.originalTransactionId)
            : "—",
        csv: (transaction) => transaction.originalTransactionId ?? "",
      },
      columns.credit("Refund Amount"),
      columns.date,
      columns.status,
    ],
  },
];

export const getFinanceReport = (id?: string) => financeReports.find((report) => report.id === id);

/** Ledger rows for a report within a date range, newest first. */
export const getReportRows = (report: FinanceReport, period: string) => {
  const from = getDateFrom(period);
  return mockWalletLedger
    .filter((transaction) => report.includes(transaction) && new Date(transaction.createdAt).getTime() >= from)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// TODO: replace with the export endpoint once it exists; this only covers the sample ledger rows.
export const exportReportCsv = (report: FinanceReport, period: string) => {
  const rows = getReportRows(report, period);
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`${report.id}-report-${today}.csv`, [
    report.columns.map((column) => column.header),
    ...rows.map((transaction) => report.columns.map((column) => column.csv(transaction))),
  ]);
};
