import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, CircleAlert, Clock, Eye, Flag, Search, ShieldCheck } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { ListLoadState } from "@/pages/support/SupportParts";
import { complianceSummaryQuery, useComplianceSummary, useFlags } from "@/store/complianceStore";
import { formatDate, parseApiDate } from "@/utils/format";
import { CompliancePageHeader, FlagSeverityBadge, FlagSourceLabel, FlagStatusBadge } from "./ComplianceParts";
import {
  flagSeverityFilterOptions,
  flagSourceFilterOptions,
  flagStatusFilterOptions,
  matchesFlagStatus,
} from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const FlaggedActivities = () => {
  // Filters live in the URL so "Back to Flagged Activities" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({ status: "all", severity: "all", source: "all", page: "1" });
  const search = get("q");
  const status = get("status");
  const severity = get("severity");
  const source = get("source");

  const { data: summary } = useComplianceSummary();
  // Every flag is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: flags, error, loading, refresh } = useFlags();

  // The summary body isn't documented; fall back to counting the list.
  const stats = useMemo(() => {
    const count = (value: string) => flags?.filter((flag) => flag.status === value).length ?? null;
    return {
      total: summary?.total ?? flags?.length ?? null,
      pending: summary?.pendingReview ?? count("pending_review"),
      underReview: summary?.underReview ?? count("under_review"),
      resolved: summary?.resolved ?? count("resolved"),
    };
  }, [summary, flags]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (flags ?? [])
      .filter(
        (flag) =>
          matchesFlagStatus(flag, status) &&
          (severity === "all" || flag.severity === severity) &&
          (source === "all" || flag.source === source) &&
          (!query ||
            [flag.code, flag.userName, flag.activity, flag.reason, flag.campaignId ?? "", flag.campaignName ?? ""].some(
              (value) => value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [flags, search, status, severity, source]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);
  const pageFlags = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const refreshAll = () => {
    void complianceSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const count = (value: number | null) => (value === null ? "…" : value.toLocaleString());
  const total = flags?.length ?? 0;

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Compliance"
        description="Review flagged activity, content reports and compliance records across the platform."
        actions={<RefreshButton label="Refresh flags" loading={loading} onClick={refreshAll} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard label="Total Flags" value={count(stats.total)} note="All compliance flags recorded." icon={Flag} />
        <WebAppStatCard
          label="Pending Review"
          value={count(stats.pending)}
          note="Awaiting a compliance review."
          icon={Clock}
        />
        <WebAppStatCard
          label="Under Review"
          value={count(stats.underReview)}
          note="Currently being reviewed."
          icon={Eye}
          tone="blue"
        />
        <WebAppStatCard
          label="Resolved"
          value={count(stats.resolved)}
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
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-64"
          />
          <WebAppSelectInput
            id="flagStatus"
            options={flagStatusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="flagSeverity"
            options={flagSeverityFilterOptions}
            value={severity}
            onChange={(value) => update({ severity: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="flagSource"
            options={flagSourceFilterOptions}
            value={source}
            onChange={(value) => update({ source: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        </div>

        {error && flags && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh flags: {error.message}
          </p>
        )}

        {!flags ? (
          <ListLoadState error={error} hasData={false} what="flagged activities" onRetry={refreshAll} />
        ) : pageFlags.length === 0 ? (
          <WebAppEmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title={total === 0 ? "No flagged activity" : "No flags found"}
            description={total === 0 ? "Activity flagged by the platform or reported by users appears here." : "Try a different search term or filter."}
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
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap text-gray-900">{flag.code}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {flag.userId ? (
                        <Link to={`/users/${encodeURIComponent(flag.userId)}`} className={linkClass}>
                          {flag.userName}
                        </Link>
                      ) : (
                        flag.userName
                      )}
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
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{flag.createdAt ? formatDate(parseApiDate(flag.createdAt)) : "—"}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/compliance/flags/${encodeURIComponent(flag.code)}`} className={linkClass}>
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
            onPageChange={(next) => update({ page: next })}
            itemLabel="flags"
          />
        )}
      </WebAppCard>
    </div>
  );
};
