import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { mockContentReports } from "@/data/compliance";
import { useCompliance } from "@/hooks/useCompliance";
import { formatDate } from "@/utils/format";
import { CompliancePageHeader, FlagStatusBadge } from "./ComplianceParts";
import { flagStatusFilterOptions, reportReasonFilterOptions, reportReasonLabels } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const ContentReports = () => {
  const flags = useCompliance((state) => state.flags);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [reason, setReason] = useState("all");
  const [page, setPage] = useState(1);

  // A report's status is its flag's status, so it follows the compliance review.
  const reports = useMemo(
    () =>
      mockContentReports.map((report) => ({
        ...report,
        status: flags.find((flag) => flag.id === report.flagId)?.status ?? "pending_review",
      })),
    [flags],
  );

  // TODO: move search / filters / paging to the API once the reports endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports
      .filter(
        (report) =>
          (status === "all" || report.status === status) &&
          (reason === "all" || report.reason === reason) &&
          (!query ||
            [report.id, report.reporterName, report.reportedUserName, report.content].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reports, search, status, reason]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReports = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Content Reports"
        description="Manage reports submitted about potentially prohibited or inappropriate content."
        section="Content Reports"
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
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="reportStatus"
            options={flagStatusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="reportReason"
            options={reportReasonFilterOptions}
            value={reason}
            onChange={withPageReset(setReason)}
            fullWidth={false}
            containerClassName="w-full sm:w-48"
          />
        </div>

        {pageReports.length === 0 ? (
          <WebAppEmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No reports found"
            description="Try a different search term or filter."
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
                      <Link to={`/users/${report.reporterId}`} className={linkClass}>
                        {report.reporterName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/users/${report.reportedUserId}`} className={linkClass}>
                        {report.reportedUserName}
                      </Link>
                    </td>
                    <td className="max-w-72 px-5 py-3.5 text-gray-700">
                      <p className="truncate" title={report.content}>
                        {report.content}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{reportReasonLabels[report.reason]}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <FlagStatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatDate(report.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/compliance/flags/${report.flagId}`} className={linkClass}>
                        View
                      </Link>
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
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel="reports"
          />
        )}
      </WebAppCard>
    </div>
  );
};
