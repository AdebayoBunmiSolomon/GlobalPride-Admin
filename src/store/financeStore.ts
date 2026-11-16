import { financeService, type FinanceRange, type FinanceReportName } from "@/api/services/finance";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/finance/summary, cached per date range. */
export const financeSummaryQuery = createQueryStore((range: FinanceRange) => financeService.summary(range), {
  staleTime: 2 * 60_000,
});

/** One page of a finance report, cached per report, range and page (the API pages and filters). */
export const financeReportQuery = createQueryStore(
  (report: FinanceReportName, range: FinanceRange, page: number, pageSize: number) =>
    financeService.report(report, range, page, pageSize),
  { staleTime: 2 * 60_000 },
);

export const useFinanceSummary = (range: FinanceRange) => financeSummaryQuery.useQuery(range);
export const useFinanceReport = (report: FinanceReportName, range: FinanceRange, page: number, pageSize: number) =>
  financeReportQuery.useQuery(report, range, page, pageSize);

/** Downloads a report's CSV from the API (with the auth header). */
export const downloadFinanceReport = async (report: FinanceReportName, range: FinanceRange) => {
  const { blob, filename } = await financeService.exportReport(report, range);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
