import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, FileText, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useListParams } from "@/hooks/useListParams";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { ListLoadState } from "@/pages/support/SupportParts";
import { useContentReports } from "@/store/complianceStore";
import { formatDate, parseApiDate } from "@/utils/format";
import { CompliancePageHeader, FlagStatusBadge } from "./ComplianceParts";
import { reportReasonFilterOptions, reportReasonLabels, reportStatusFilterOptions } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

const UserLink = ({ id, name }: { id: string | null; name: string }): ReactNode =>
  id ? (
    <Link to={`/users/${encodeURIComponent(id)}`} className={linkClass}>
      {name}
    </Link>
  ) : (
    name
  );

export const ContentReports = () => {
  const { get, update, page: requestedPage } = useListParams({ status: "all", reason: "all", page: "1" });
  const search = get("q");
  const status = get("status");
  const reason = get("reason");
  // Every report is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: reports, error, loading, refresh } = useContentReports();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (reports ?? [])
      .filter(
        (report) =>
          (status === "all" || report.status === status) &&
          (reason === "all" || report.reason === reason) &&
          (!query ||
            [report.id, report.flagId ?? "", report.reporterName, report.reportedUserName, report.content].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports, search, status, reason]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageReports = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = reports?.length ?? 0;

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Content Reports"
        description="Reports users submitted about potentially prohibited or inappropriate content. Each report raises a flag, and its status follows that flag's review."
        section="Content Reports"
        actions={<RefreshButton label="Refresh content reports" loading={loading} onClick={() => void refresh()} />}
      />

      <WebAppCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4">
          <WebAppInput
            id="reportSearch"
            type="search"
            placeholder="Search reports"
            aria-label="Search reports"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="reportStatus"
            options={reportStatusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="reportReason"
            options={reportReasonFilterOptions}
            value={reason}
            onChange={(value) => update({ reason: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-48"
          />
        </div>

        {error && reports && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh reports: {error.message}
          </p>
        )}

        {!reports ? (
          <ListLoadState error={error} hasData={false} what="content reports" onRetry={() => void refresh()} />
        ) : pageReports.length === 0 ? (
          <WebAppEmptyState
            icon={<FileText className="h-6 w-6" />}
            title={total === 0 ? "No content reports yet" : "No reports found"}
            description={total === 0 ? "Messages users report from the app appear here." : "Try a different search term or filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-260 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Report ID</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reporter</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reported User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Content</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reason</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap text-gray-900">{report.id}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <UserLink id={report.reporterId} name={report.reporterName} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <UserLink id={report.reportedUserId} name={report.reportedUserName} />
                    </td>
                    <td className="max-w-72 px-5 py-3.5 text-gray-700">
                      <p className="truncate" title={report.content}>
                        {report.content || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{reportReasonLabels[report.reason]}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <FlagStatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                      {report.createdAt ? formatDate(parseApiDate(report.createdAt)) : "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {report.flagId ? (
                        <Link to={`/compliance/flags/${encodeURIComponent(report.flagId)}`} className={linkClass}>
                          View Flag
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel="reports"
          />
        )}
      </WebAppCard>
    </div>
  );
};
