import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, FileChartColumn, ReceiptText } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppStatCard } from "@/components/StatCard";
import { cn } from "@/utils/cn";
import { BreakdownTable, PeriodSelect } from "./FinanceParts";
import { useReportPeriod } from "./useReportPeriod";
import { exportReportCsv, getFinanceReport, getReportRows } from "./reports";

const PAGE_SIZE = 10;

export const FinanceReport = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { period, setPeriod, withPeriod } = useReportPeriod();
  const [page, setPage] = useState(1);
  const report = getFinanceReport(reportId);

  // TODO: page and filter on the API once the finance report endpoints exist.
  const rows = useMemo(() => (report ? getReportRows(report, period) : []), [report, period]);

  const backLink = { label: "Back to Finance & Reports", to: withPeriod("/finance") };
  const breadcrumbs = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Finance & Reports", to: withPeriod("/finance") },
    { label: report?.title ?? "Report" },
  ];

  if (!report) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<FileChartColumn className="h-6 w-6" />}
            title="Report not found"
            description="This report doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Finance & Reports", onClick: () => navigate(backLink.to) }}
          />
        </WebAppCard>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const { breakdown } = report;

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title={report.title}
        description={report.description}
        icon={<report.icon />}
        breadcrumbs={breadcrumbs}
        backLink={backLink}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelect
              value={period}
              onChange={(value) => {
                setPeriod(value);
                setPage(1);
              }}
            />
            <WebAppButton
              size="sm"
              className="h-9 text-sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => exportReportCsv(report, period)}
            >
              Export CSV
            </WebAppButton>
          </div>
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">{report.summaryTitle}</h2>
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2",
            report.summary.length === 3 ? "lg:grid-cols-3" : "xl:grid-cols-4",
          )}
        >
          {report.summary.map((item) => (
            <WebAppStatCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      {breakdown && (
        <WebAppCard divided title={breakdown.title} description={breakdown.description} bodyClassName="p-0">
          <BreakdownTable columns={breakdown.columns} rows={breakdown.rows} total={breakdown.total} />
        </WebAppCard>
      )}

      <WebAppCard divided title={report.activityTitle} description={report.activityDescription} bodyClassName="p-0">
        {pageRows.length === 0 ? (
          <WebAppEmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title={`No ${report.itemLabel}`}
            description="Nothing was recorded in this period. Try a longer date range."
          />
        ) : (
          <div className="overflow-x-auto">
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
                {pageRows.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50/60">
                    {report.columns.map((column, index) => (
                      <td
                        key={column.header}
                        className={cn("px-5 py-3.5", index === 0 ? "font-medium text-gray-900" : "text-gray-700")}
                      >
                        {column.cell(transaction)}
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/wallets/transactions/${transaction.id}`}
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

        {rows.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            itemLabel={report.itemLabel}
          />
        )}

        <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">{report.footnote}</p>
      </WebAppCard>
    </div>
  );
};
