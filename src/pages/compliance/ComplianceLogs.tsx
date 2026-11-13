import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { History, ScrollText, Search, ShieldCheck } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { disclaimerVersions, mockDisclaimerAcceptances, mockUserActivityLogs } from "@/data/compliance";
import { useCompliance } from "@/hooks/useCompliance";
import { formatDateTimeShort } from "@/utils/format";
import { CompliancePageHeader } from "./ComplianceParts";
import { activitySourceFilterOptions, activitySources } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

/** Search + filter + paging state shared by the log tables. */
const usePagedFilter = <T,>(items: T[], matches: (item: T, query: string, filter: string) => boolean) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => items.filter((item) => matches(item, search.trim().toLowerCase(), filter)),
    [items, matches, search, filter],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    filter,
    setFilter: (value: string) => {
      setFilter(value);
      setPage(1);
    },
    filtered,
    currentPage,
    setPage,
    pageItems: filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
  };
};

interface LogTableProps {
  searchId: string;
  searchPlaceholder: string;
  search: string;
  onSearch: (value: string) => void;
  /** Optional filter select, rendered next to the search box. */
  filterControl?: ReactNode;
  emptyIcon: ReactNode;
  emptyTitle: string;
  headers: string[];
  rows: ReactNode;
  isEmpty: boolean;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
}

const LogTable = ({
  searchId,
  searchPlaceholder,
  search,
  onSearch,
  filterControl,
  emptyIcon,
  emptyTitle,
  headers,
  rows,
  isEmpty,
  total,
  page,
  onPageChange,
}: LogTableProps) => (
  <WebAppCard bodyClassName="p-0">
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4">
      <WebAppInput
        id={searchId}
        type="search"
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        leftIcon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        fullWidth={false}
        containerClassName="w-full sm:w-72"
      />
      {filterControl}
    </div>

    {isEmpty ? (
      <WebAppEmptyState icon={emptyIcon} title={emptyTitle} description="Try a different search term or filter." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-220 text-left text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-600">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-5 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{rows}</tbody>
        </table>
      </div>
    )}

    {total > 0 && (
      <WebAppPagination
        className="border-t border-gray-200 px-5 py-4"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={onPageChange}
        itemLabel="records"
      />
    )}
  </WebAppCard>
);

const cell = "px-5 py-3.5";

// ---- User activity ----

const activityLogs = [...mockUserActivityLogs].sort((a, b) => b.at.localeCompare(a.at));

const matchesActivity = (log: (typeof activityLogs)[number], query: string, source: string) =>
  (source === "all" || log.source === source) &&
  (!query || [log.userName, log.activity, log.result, log.flagId].some((value) => value.toLowerCase().includes(query)));

export const UserActivityLogs = () => {
  // TODO: fetch activity logs from the compliance API.
  const list = usePagedFilter(activityLogs, matchesActivity);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="User Activity Logs"
        description="A chronological record of relevant user activity for compliance investigation."
        section="User Activity Logs"
      />
      <LogTable
        searchId="activitySearch"
        searchPlaceholder="Search activity"
        search={list.search}
        onSearch={list.setSearch}
        filterControl={
          <WebAppSelectInput
            id="activitySource"
            options={activitySourceFilterOptions}
            value={list.filter}
            onChange={list.setFilter}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        }
        emptyIcon={<History className="h-6 w-6" />}
        emptyTitle="No activity found"
        headers={["Date/Time", "User", "Activity", "Source", "Result", "Action"]}
        isEmpty={list.pageItems.length === 0}
        total={list.filtered.length}
        page={list.currentPage}
        onPageChange={list.setPage}
        rows={list.pageItems.map((log) => (
          <tr key={log.id} className="hover:bg-gray-50/60">
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{formatDateTimeShort(log.at)}</td>
            <td className={`${cell} whitespace-nowrap`}>
              <Link to={`/users/${log.userId}`} className={linkClass}>
                {log.userName}
              </Link>
            </td>
            <td className={`${cell} text-gray-900`}>{log.activity}</td>
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{activitySources[log.source].label}</td>
            <td className={`${cell} text-gray-700`}>{log.result}</td>
            <td className={`${cell} whitespace-nowrap`}>
              <Link to={`/compliance/flags/${log.flagId}`} className={linkClass}>
                View Flag
              </Link>
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ---- Audit logs ----

const matchesAudit = (log: { action: string; recordId: string; details: string; adminName: string }, query: string) =>
  !query || [log.action, log.recordId, log.details, log.adminName].some((value) => value.toLowerCase().includes(query));

export const AuditLogs = () => {
  // Newest first; review actions taken in this session are added by the store.
  const auditLogs = useCompliance((state) => state.auditLogs);
  const sorted = useMemo(() => [...auditLogs].sort((a, b) => b.at.localeCompare(a.at)), [auditLogs]);
  const list = usePagedFilter(sorted, matchesAudit);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Audit Logs"
        description="Administrative actions taken within Compliance. These records are read-only."
        section="Audit Logs"
      />
      <LogTable
        searchId="auditSearch"
        searchPlaceholder="Search audit logs"
        search={list.search}
        onSearch={list.setSearch}
        emptyIcon={<ScrollText className="h-6 w-6" />}
        emptyTitle="No audit records found"
        headers={["Date/Time", "Admin", "Action", "Record", "Details"]}
        isEmpty={list.pageItems.length === 0}
        total={list.filtered.length}
        page={list.currentPage}
        onPageChange={list.setPage}
        rows={list.pageItems.map((log) => (
          <tr key={log.id} className="hover:bg-gray-50/60">
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{formatDateTimeShort(log.at)}</td>
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{log.adminName}</td>
            <td className={`${cell} font-medium whitespace-nowrap text-gray-900`}>{log.action}</td>
            <td className={`${cell} whitespace-nowrap`}>
              <Link to={`/compliance/flags/${log.recordId}`} className={linkClass}>
                {log.recordId}
              </Link>
            </td>
            <td className={`${cell} max-w-96 text-gray-700`}>
              <p className="truncate" title={log.details}>
                {log.details}
              </p>
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

// ---- Disclaimer acceptances ----

const versionFilterOptions = [
  { label: "All Versions", value: "all" },
  ...disclaimerVersions.map((version) => ({ label: version, value: version })),
];

const acceptances = [...mockDisclaimerAcceptances].sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt));

const matchesAcceptance = (record: (typeof acceptances)[number], query: string, version: string) =>
  (version === "all" || record.version === version) &&
  (!query || [record.userName, record.userId].some((value) => value.toLowerCase().includes(query)));

export const DisclaimerLogs = () => {
  // TODO: fetch disclaimer acceptances from the compliance API.
  const list = usePagedFilter(acceptances, matchesAcceptance);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Disclaimer Acceptance Logs"
        description="Evidence that users accepted the Global Pride platform disclaimer. These records are read-only."
        section="Disclaimer Acceptance Logs"
      />
      <LogTable
        searchId="disclaimerSearch"
        searchPlaceholder="Search users"
        search={list.search}
        onSearch={list.setSearch}
        filterControl={
          <WebAppSelectInput
            id="disclaimerVersion"
            options={versionFilterOptions}
            value={list.filter}
            onChange={list.setFilter}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
        }
        emptyIcon={<ShieldCheck className="h-6 w-6" />}
        emptyTitle="No acceptance records found"
        headers={["User", "Disclaimer Version", "Accepted", "IP / Device"]}
        isEmpty={list.pageItems.length === 0}
        total={list.filtered.length}
        page={list.currentPage}
        onPageChange={list.setPage}
        rows={list.pageItems.map((record) => (
          <tr key={record.id} className="hover:bg-gray-50/60">
            <td className={`${cell} whitespace-nowrap`}>
              <Link to={`/users/${record.userId}`} className={linkClass}>
                {record.userName}
              </Link>
            </td>
            <td className={cell}>
              <WebAppBadge>{record.version}</WebAppBadge>
            </td>
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{formatDateTimeShort(record.acceptedAt)}</td>
            <td className={`${cell} whitespace-nowrap`}>
              {record.ip ? (
                <span className="text-gray-700">
                  {record.ip}
                  {record.device && ` · ${record.device}`}
                </span>
              ) : (
                <span className="text-gray-400">Not captured</span>
              )}
            </td>
          </tr>
        ))}
      />
    </div>
  );
};
