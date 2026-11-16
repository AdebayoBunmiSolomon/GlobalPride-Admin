import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { isRaw, key, list, nested, num, text, type Raw } from "@/api/utils/raw";
import type {
  AdminResponse,
  FinanceReportRow,
  FinanceServiceRevenue,
  FinanceSummary,
  LogPage,
  PagedResult,
} from "@/api/types/response";

// Swagger documents the parameters but no response bodies for
// /admin/finance, so figures are read defensively (see utils/raw). Each
// headline may come flat ("refundsTotal") or grouped ("refunds": { total }).

/** The API's report names. */
export type FinanceReportName = "revenue" | "vat" | "funding" | "referral-bonuses" | "refunds";

/** yyyy-MM-dd bounds; omit both for all time. */
export interface FinanceRange {
  from?: string;
  to?: string;
}

/** A figure that may be a number, or an object holding it (e.g. `refunds: { total, count }`). */
const figure = (raw: Raw, names: string[], inner: string[]) => {
  const flat = num(raw, ...names);
  if (flat !== null) return flat;
  for (const name of names) {
    const group = nested(raw, name);
    const value = num(group, ...inner);
    if (value !== null) return value;
  }
  return null;
};

/** "sms" / "SmsCampaign" → "SMS Campaigns", etc. */
export const serviceLabel = (service: string) => {
  const name = key(service);
  if (name.includes("sms")) return "SMS Campaigns";
  if (name.includes("image")) return "Image Campaigns";
  if (name.includes("audience")) return "Audience Rental";
  if (name.includes("voice")) return "Voice Campaigns";
  if (name.includes("video")) return "Video Campaigns";
  return service.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const toServiceRevenue = (raw: Raw): FinanceServiceRevenue => {
  const service = text(raw, "service", "type", "category", "name", "key") ?? "other";
  return {
    service,
    label: text(raw, "label", "displayName") ?? serviceLabel(service),
    amount: num(raw, "amount", "revenue", "total", "serviceAmount") ?? 0,
    vat: num(raw, "vat", "vatAmount"),
    transactions: num(raw, "transactions", "count", "transactionCount"),
  };
};

/** Revenue per service: an array of rows, or an object keyed by service (`{ sms: 1200, image: … }`). */
const toServices = (raw: Raw, revenue: Raw): FinanceServiceRevenue[] => {
  const rows = [
    ...list(raw, "revenueByService", "services", "byService", "breakdown"),
    ...list(revenue, "byService", "services", "breakdown"),
  ];
  if (rows.length > 0) return rows.map(toServiceRevenue);
  const keyed = [nested(raw, "revenueByService", "byService"), nested(revenue, "byService")].find(
    (group) => Object.keys(group).length > 0,
  );
  return keyed
    ? Object.entries(keyed).map(([service, value]) =>
        toServiceRevenue(isRaw(value) ? { service, ...value } : { service, amount: value }),
      )
    : [];
};

const toSummary = (result: unknown): FinanceSummary => {
  const raw = isRaw(result) ? result : {};
  const revenue = nested(raw, "revenue");
  return {
    grossRevenue: num(raw, "grossRevenue", "totalRevenue", "revenueTotal") ?? num(revenue, "gross", "total", "amount"),
    vatCollected: figure(raw, ["vatCollected", "vat", "totalVat"], ["collected", "total", "amount"]) ?? num(revenue, "vat"),
    vatRate: num(raw, "vatRate", "vatRatePercent") ?? num(nested(raw, "vat"), "rate", "ratePercent"),
    refunds: figure(raw, ["refunds", "refundsTotal", "totalRefunds"], ["total", "amount"]),
    refundCount: num(raw, "refundCount", "refundsCount") ?? num(nested(raw, "refunds"), "count", "transactions"),
    referralBonuses: figure(
      raw,
      ["referralBonuses", "referralBonusesPaid", "referralBonusTotal", "referrals"],
      ["paid", "total", "amount", "bonusesPaid"],
    ),
    referralCount:
      num(raw, "referralBonusCount", "successfulReferrals") ??
      num(nested(raw, "referralBonuses", "referrals"), "count", "successful", "successfulReferrals"),
    usersRewarded: num(raw, "usersRewarded") ?? num(nested(raw, "referralBonuses", "referrals"), "usersRewarded", "users"),
    funding: figure(raw, ["walletFunding", "funding", "fundingTotal"], ["successful", "total", "amount"]),
    fundingCount: num(raw, "fundingCount", "fundingTransactions") ?? num(nested(raw, "walletFunding", "funding"), "count", "transactions"),
    fundingPending: num(raw, "fundingPending", "pendingFunding") ?? num(nested(raw, "walletFunding", "funding"), "pending"),
    fundingFailed: num(raw, "fundingFailed", "failedFunding") ?? num(nested(raw, "walletFunding", "funding"), "failed"),
    revenueByService: toServices(raw, revenue),
    series: list(raw, "series", "daily", "perDay", "days", "revenueSeries")
      .map((day) => ({
        date: (text(day, "date", "day") ?? "").slice(0, 10),
        total: num(day, "revenue", "total", "amount", "grossRevenue") ?? 0,
        vat: num(day, "vat"),
      }))
      .filter((day) => day.date)
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
};

const toRow = (raw: Raw, index: number): FinanceReportRow => {
  const user = nested(raw, "user");
  const id = text(raw, "id", "transactionId", "guid") ?? `row${index}`;
  const amount = num(raw, "serviceAmount", "amount", "subtotal", "bonusAmount", "refundAmount");
  const vat = num(raw, "vat", "vatAmount");
  return {
    id,
    reference: text(raw, "reference", "transactionReference", "transactionRef") ?? id,
    userId: text(raw, "userId") ?? text(user, "id", "userId"),
    userName: text(raw, "userName", "userFullName", "fullName") ?? text(user, "fullName", "name", "email") ?? "—",
    service: text(raw, "service", "category", "type"),
    amount,
    vat,
    total: num(raw, "total", "totalAmount", "totalCharge", "grossAmount") ?? (amount !== null && vat !== null ? amount + vat : null),
    status: text(raw, "status")?.toLowerCase() ?? null,
    paymentReference: text(raw, "paymentReference", "providerReference", "gatewayReference"),
    originalReference: text(raw, "originalReference", "originalTransactionReference", "refundedTransactionReference"),
    createdAt: text(raw, "createdAt", "date", "completedAt"),
  };
};

const rangeParams = ({ from, to }: FinanceRange) => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) });

/** Admin Finance & Reports (`/admin/finance`). Every call rejects with a normalized `ApiError`. */
export const financeService = {
  summary: async (range: FinanceRange): Promise<FinanceSummary> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>("/admin/finance/summary", {
      params: rangeParams(range),
      useAuth: true,
    });
    return toSummary(unwrap(data, "We couldn't load the finance summary."));
  },

  /** One page of a report, newest first. */
  report: async (
    report: FinanceReportName,
    range: FinanceRange,
    page: number,
    pageSize: number,
  ): Promise<LogPage<FinanceReportRow>> => {
    const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>(
      `/admin/finance/reports/${encodeURIComponent(report)}`,
      { params: { ...rangeParams(range), page, pageSize }, useAuth: true },
    );
    const result = unwrap(data, "We couldn't load this report.");
    return {
      items: (result.items ?? []).filter(isRaw).map(toRow),
      totalCount: result.totalCount ?? 0,
      totalPages: result.totalPages ?? 0,
    };
  },

  /** The report as CSV (at most 50,000 rows). */
  exportReport: async (report: FinanceReportName, range: FinanceRange): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get<Blob>(`/admin/finance/reports/${encodeURIComponent(report)}/export`, {
      params: rangeParams(range),
      responseType: "blob",
      useAuth: true,
      timeout: 120_000,
    });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
    const filename = match ? decodeURIComponent(match[1] ?? match[2]) : `${report}-report.csv`;
    return { blob: response.data, filename };
  },
};

