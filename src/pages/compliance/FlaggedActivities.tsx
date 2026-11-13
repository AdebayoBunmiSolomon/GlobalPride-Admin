import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Clock, Eye, Flag, Search, ShieldCheck } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useCompliance } from "@/hooks/useCompliance";
import { formatDate } from "@/utils/format";
import { CompliancePageHeader, FlagSeverityBadge, FlagSourceLabel, FlagStatusBadge } from "./ComplianceParts";
import { flagSeverityFilterOptions, flagSourceFilterOptions, flagStatusFilterOptions } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const FlaggedActivities = () => {
  const flags = useCompliance((state) => state.flags);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const count = (value: string) => flags.filter((flag) => flag.status === value).length;
    return {
      total: flags.length,
      pending: count("pending_review"),
      underReview: count("under_review"),
      resolved: count("resolved"),
    };
  }, [flags]);

  // TODO: move search / filters / paging to the API once the compliance endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return flags
      .filter(
        (flag) =>
          (status === "all" || flag.status === status) &&
          (severity === "all" || flag.severity === severity) &&
          (source === "all" || flag.source === source) &&
          (!query ||
            [flag.id, flag.userName, flag.activity, flag.reason].some((value) => value.toLowerCase().includes(query))),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [flags, search, status, severity, source]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageFlags = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Compliance"
        description="Review flagged activity, content reports and compliance records across the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard label="Total Flags" value={stats.total.toLocaleString()} note="All compliance flags recorded." icon={Flag} />
        <WebAppStatCard
          label="Pending Review"
          value={stats.pending.toLocaleString()}
          note="Awaiting a compliance review."
          icon={Clock}
        />
        <WebAppStatCard
          label="Under Review"
          value={stats.underReview.toLocaleString()}
          note="Currently being reviewed."
          icon={Eye}
          tone="blue"
        />
        <WebAppStatCard
          label="Resolved"
          value={stats.resolved.toLocaleString()}
          note="Reviewed and actioned."
          icon={CheckCheck}
          tone="green"
        />
      </div>

      <WebAppCard
        title="Flagged Activities"
        description="Review potentially prohibited activities and take appropriate action."
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="flagSearch"
            type="search"
            placeholder="Search flags"
            aria-label="Search flags"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-64"
          />
          <WebAppSelectInput
            id="flagStatus"
            options={flagStatusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="flagSeverity"
            options={flagSeverityFilterOptions}
            value={severity}
            onChange={withPageReset(setSeverity)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="flagSource"
            options={flagSourceFilterOptions}
            value={source}
            onChange={withPageReset(setSource)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        </div>

        {pageFlags.length === 0 ? (
          <WebAppEmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No flags found"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-280 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Flag ID</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Activity</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reason</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Severity</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap text-gray-900">{flag.id}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/users/${flag.userId}`} className={linkClass}>
                        {flag.userName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{flag.activity}</td>
                    <td className="max-w-56 px-5 py-3.5 text-gray-700">
                      <p className="truncate" title={flag.reason}>
                        {flag.reason}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <FlagSourceLabel source={flag.source} />
                    </td>
                    <td className="px-5 py-3.5">
                      <FlagSeverityBadge severity={flag.severity} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <FlagStatusBadge status={flag.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatDate(flag.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/compliance/flags/${flag.id}`} className={linkClass}>
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
            itemLabel="flags"
          />
        )}
      </WebAppCard>
    </div>
  );
};
