import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CircleAlert, Download, FileChartColumn, ReceiptText } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppStatCard } from "@/components/StatCard";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { financeReportQuery, financeSummaryQuery, useFinanceReport, useFinanceSummary } from "@/store/financeStore";
import { cn } from "@/utils/cn";
import { exportReportCsv } from "./exportReport";
import { BreakdownTable, PeriodSelect } from "./FinanceParts";
import { useReportPeriod } from "./useReportPeriod";
import { financeReports, getFinanceReport, type FinanceReport as FinanceReportDefinition } from "./reports";

const PAGE_SIZE = 20;

const ReportBody = ({ report }: { report: FinanceReportDefinition }) => {
  const { period, range, page, setPeriod, setPage, withPeriod } = useReportPeriod();
  const summary = useFinanceSummary(range);
  const rows = useFinanceReport(report.api, range, page, PAGE_SIZE);
  const [exporting, setExporting] = useState(false);
  const breakdown = summary.data && report.breakdown ? report.breakdown(summary.data) : null;
  const summaryItems = summary.data ? report.summary(summary.data) : [];

  const refreshAll = () => {
    void financeSummaryQuery.fetch([range], { force: true });
    void financeReportQuery.fetch([report.api, range, page, PAGE_SIZE], { force: true });
  };

  const exportCsv = async () => {
    setExporting(true);
    await exportReportCsv(report, range);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title={report.title}
        description={report.description}
        icon={<report.icon />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Finance & Reports", to: withPeriod("/finance") },
          { label: report.title },
        ]}
        backLink={{ label: "Back to Finance & Reports", to: withPeriod("/finance") }}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelect value={period} onChange={setPeriod} />
            <RefreshButton label="Refresh report" loading={rows.loading || summary.loading} onClick={refreshAll} />
            <WebAppButton
              size="sm"
              className="h-9 text-sm"
              loading={exporting}
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => void exportCsv()}
            >
              Export CSV
            </WebAppButton>
          </div>
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">{report.summaryTitle}</h2>
        {summary.error && !summary.data ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't load the summary: {summary.error.message}
          </p>
        ) : !summary.data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading summary">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              summaryItems.length === 3 ? "lg:grid-cols-3" : summaryItems.length === 2 ? "" : "xl:grid-cols-4",
            )}
          >
            {summaryItems.map((item) => (
              <WebAppStatCard key={item.label} {...item} />
            ))}
          </div>
        )}
      </section>

      {breakdown && (
        <WebAppCard divided title={breakdown.title} description={breakdown.description} bodyClassName="p-0">
          <BreakdownTable columns={breakdown.columns} rows={breakdown.rows} total={breakdown.total} />
        </WebAppCard>
      )}

      <WebAppCard
        divided
        title={report.activityTitle}
        description={
          rows.data ? `${report.activityDescription} ${rows.data.totalCount.toLocaleString()} records, newest first.` : report.activityDescription
        }
        bodyClassName="p-0"
      >
        {rows.error && rows.data && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh: {rows.error.message}
          </p>
        )}

        {!rows.data ? (
          rows.error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load this report"
              description={rows.error.message}
              primaryAction={{ label: "Try again", onClick: () => void rows.refresh() }}
            />
          ) : (
            <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading report">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-9 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )
        ) : rows.data.items.length === 0 ? (
          <WebAppEmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title={`No ${report.itemLabel}`}
            description="Nothing was recorded in this period. Try a longer date range."
          />
        ) : (
          <div className={cn("overflow-x-auto transition-opacity", rows.loading && "opacity-60")}>
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  {report.columns.map((column) => (
                    <th key={column.header} scope="col" className="px-5 py-3 font-semibold">
                      {column.header}
                    </th>
                  ))}
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.data.items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60">
                    {report.columns.map((column, index) => (
                      <td
                        key={column.header}
                        className={cn("px-5 py-3.5", index === 0 ? "font-medium text-gray-900" : "text-gray-700")}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/wallets/transactions/${encodeURIComponent(row.reference)}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.data && rows.data.totalCount > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={page}
            pageSize={PAGE_SIZE}
            total={rows.data.totalCount}
            onPageChange={setPage}
            itemLabel={report.itemLabel}
          />
        )}

        <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">{report.footnote}</p>
      </WebAppCard>
    </div>
  );
};

export const FinanceReport = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { withPeriod } = useReportPeriod();
  const report = getFinanceReport(reportId);

  if (!report) {
    const backLink = { label: "Back to Finance & Reports", to: withPeriod("/finance") };
    return (
      <div>
        <WebAppPageHeader
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Finance & Reports", to: backLink.to },
            { label: "Report" },
          ]}
          backLink={backLink}
        />
        <WebAppCard>
          <WebAppEmptyState
            icon={<FileChartColumn className="h-6 w-6" />}
            title="Report not found"
            description={`Available reports: ${financeReports.map((item) => item.title).join(", ")}.`}
            primaryAction={{ label: "Back to Finance & Reports", onClick: () => navigate(backLink.to) }}
          />
        </WebAppCard>
      </div>
    );
  }

  // Keyed so switching reports starts on page 1 with fresh state.
  return <ReportBody key={report.id} report={report} />;
};
