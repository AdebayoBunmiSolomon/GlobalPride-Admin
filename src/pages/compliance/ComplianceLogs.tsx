import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, History, ScrollText, Search, ShieldCheck } from "lucide-react";

import type { ApiError, LogPage } from "@/api/types/response";
import type { LogQuery } from "@/api/services/compliance";
import { WebAppBadge } from "@/components/Badge";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import { activityStyle, activityTypeOptions, humanizeType } from "@/pages/shared/activityStyle";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { useActivityLogs, useAuditLogs, useDisclaimerLogs } from "@/store/complianceStore";
import { cn } from "@/utils/cn";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { toneStyles } from "@/utils/tones";
import { CompliancePageHeader } from "./ComplianceParts";
import { recordLink } from "./complianceOptions";

const PAGE_SIZE = 20;

const linkClass = "font-medium text-primary hover:underline";

const cell = "px-5 py-3.5";

const when = (value: string) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

/**
 * URL-backed search, date range, optional type filter and page for a
 * server-paged log. The search is debounced before it reaches the API.
 */
const useLogQuery = () => {
  const { get, update, page } = useListParams({ type: "all", page: "1" });
  const search = get("q");
  const debouncedSearch = useDebouncedValue(search);
  const type = get("type");
  const from = get("from");
  const to = get("to");
  const query: LogQuery = {
    search: debouncedSearch,
    filter: type === "all" ? undefined : type,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  return { search, type, from, to, page, update, query };
};

interface LogTableProps<T> {
  log: ReturnType<typeof useLogQuery>;
  result: { data: LogPage<T> | null; error: ApiError | null; loading: boolean; refresh: () => void };
  searchPlaceholder: string;
  /** Optional filter select, rendered next to the search box. */
  filterControl?: ReactNode;
  emptyIcon: ReactNode;
  emptyTitle: string;
  headers: string[];
  renderRow: (item: T) => ReactNode;
}

const LogTable = <T,>({
  log,
  result,
  searchPlaceholder,
  filterControl,
  emptyIcon,
  emptyTitle,
  headers,
  renderRow,
}: LogTableProps<T>) => {
  const { data, error, loading } = result;
  const filtered = Boolean(log.search || log.from || log.to || log.type !== "all");

  return (
    <WebAppCard bodyClassName="p-0">
      <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 px-5 py-4">
        <WebAppInput
          id="logSearch"
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          leftIcon={<Search className="h-4 w-4" />}
          value={log.search}
          onChange={(event) => log.update({ q: event.target.value, page: null })}
          fullWidth={false}
          containerClassName="w-full sm:w-72"
        />
        {filterControl}
        <WebAppInput
          id="logFrom"
          type="date"
          aria-label="From date"
          value={log.from}
          max={log.to || undefined}
          onChange={(event) => log.update({ from: event.target.value, page: null })}
          fullWidth={false}
          containerClassName="w-full sm:w-40"
        />
        <span className="hidden pb-3 text-sm text-gray-500 sm:inline">to</span>
        <WebAppInput
          id="logTo"
          type="date"
          aria-label="To date"
          value={log.to}
          min={log.from || undefined}
          onChange={(event) => log.update({ to: event.target.value, page: null })}
          fullWidth={false}
          containerClassName="w-full sm:w-40"
        />
        <div className="ml-auto">
          <RefreshButton label="Refresh" loading={loading} onClick={result.refresh} />
        </div>
      </div>

      {error && data && (
        <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
          <CircleAlert className="h-4 w-4" />
          Couldn't refresh: {error.message}
        </p>
      )}

      {!data ? (
        error ? (
          <WebAppEmptyState
            icon={<CircleAlert className="h-6 w-6" />}
            title="Couldn't load these records"
            description={error.message}
            primaryAction={{ label: "Try again", onClick: result.refresh }}
          />
        ) : (
          <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading records">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )
      ) : data.items.length === 0 ? (
        <WebAppEmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={filtered ? "Try a different search term, filter or date range." : "Nothing has been recorded yet."}
        />
      ) : (
        <div className={cn("overflow-x-auto transition-opacity", loading && "opacity-60")}>
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
            <tbody className="divide-y divide-gray-100">{data.items.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {data && data.totalCount > 0 && (
        <WebAppPagination
          className="border-t border-gray-200 px-5 py-4"
          page={log.page}
          pageSize={PAGE_SIZE}
          total={data.totalCount}
          onPageChange={(next) => log.update({ page: next })}
          itemLabel="records"
        />
      )}
    </WebAppCard>
  );
};

const UserCell = ({ id, name }: { id: string | null; name: string | null }) =>
  id ? (
    <Link to={`/users/${encodeURIComponent(id)}`} className={linkClass}>
      {name || id}
    </Link>
  ) : (
    <span className="text-gray-700">{name || "—"}</span>
  );

// ---- User activity ----

export const UserActivityLogs = () => {
  const log = useLogQuery();
  const result = useActivityLogs(log.query);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="User Activity Logs"
        description="Platform-wide user activity (the same feed users see on their Activity screen), for compliance investigation."
        section="User Activity Logs"
      />
      <LogTable
        log={log}
        result={{ ...result, refresh: () => void result.refresh() }}
        searchPlaceholder="Search activity or user"
        filterControl={
          <WebAppSelectInput
            id="activityType"
            aria-label="Activity type"
            options={activityTypeOptions}
            value={activityTypeOptions.some((option) => option.value === log.type) ? log.type : "all"}
            onChange={(value) => log.update({ type: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-56"
          />
        }
        emptyIcon={<History className="h-6 w-6" />}
        emptyTitle="No activity found"
        headers={["Date/Time", "User", "Activity", "Details"]}
        renderRow={(activity) => {
          const { icon: Icon, tone } = activityStyle(activity.type);
          return (
            <tr key={activity.id} className="hover:bg-gray-50/60">
              <td className={`${cell} whitespace-nowrap text-gray-700`}>{when(activity.createdAt)}</td>
              <td className={`${cell} whitespace-nowrap`}>
                <UserCell id={activity.userId} name={activity.userName} />
              </td>
              <td className={cell}>
                <span className="flex items-center gap-2.5">
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", toneStyles[tone].icon)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium text-gray-900">
                    {activity.title || humanizeType(activity.type) || "Activity"}
                  </span>
                </span>
              </td>
              <td className={`${cell} max-w-96 text-gray-700`}>
                <p className="truncate" title={activity.description}>
                  {activity.description || "—"}
                </p>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
};

// ---- Audit logs ----

export const AuditLogs = () => {
  const log = useLogQuery();
  const result = useAuditLogs(log.query);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Audit Logs"
        description="What administrators did in the console. These records are read-only."
        section="Audit Logs"
      />
      <LogTable
        log={log}
        result={{ ...result, refresh: () => void result.refresh() }}
        searchPlaceholder="Search admin, action, record or details"
        emptyIcon={<ScrollText className="h-6 w-6" />}
        emptyTitle="No audit records found"
        headers={["Date/Time", "Admin", "Action", "Record", "Details"]}
        renderRow={(entry) => {
          const link = recordLink(entry.recordId);
          return (
            <tr key={entry.id} className="hover:bg-gray-50/60">
              <td className={`${cell} whitespace-nowrap text-gray-700`}>{when(entry.at)}</td>
              <td className={`${cell} whitespace-nowrap text-gray-700`}>{entry.adminName}</td>
              <td className={`${cell} font-medium whitespace-nowrap text-gray-900`}>{humanizeType(entry.action) || "—"}</td>
              <td className={`${cell} whitespace-nowrap`}>
                {link ? (
                  <Link to={link} className={linkClass}>
                    {entry.recordId}
                  </Link>
                ) : (
                  <span className="text-gray-700">{entry.recordId ?? "—"}</span>
                )}
              </td>
              <td className={`${cell} max-w-96 text-gray-700`}>
                <p className="truncate" title={entry.details}>
                  {entry.details || "—"}
                </p>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
};

// ---- Disclaimer acceptances ----

export const DisclaimerLogs = () => {
  const log = useLogQuery();
  const result = useDisclaimerLogs(log.query);

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Disclaimer Acceptance Logs"
        description="When users accepted the campaign responsibility disclaimer. These records are read-only."
        section="Disclaimer Acceptance Logs"
      />
      <LogTable
        log={log}
        result={{ ...result, refresh: () => void result.refresh() }}
        searchPlaceholder="Search users"
        emptyIcon={<ShieldCheck className="h-6 w-6" />}
        emptyTitle="No acceptance records found"
        headers={["User", "Disclaimer Version", "Accepted", "Campaign", "IP / Device"]}
        renderRow={(record) => (
          <tr key={record.id} className="hover:bg-gray-50/60">
            <td className={`${cell} whitespace-nowrap`}>
              <UserCell id={record.userId} name={record.userName} />
            </td>
            <td className={cell}>{record.version ? <WebAppBadge>{record.version}</WebAppBadge> : "—"}</td>
            <td className={`${cell} whitespace-nowrap text-gray-700`}>{when(record.acceptedAt)}</td>
            <td className={`${cell} whitespace-nowrap`}>
              {record.campaignId ? (
                <Link to={`/campaigns/${encodeURIComponent(record.campaignId)}`} className={linkClass}>
                  {record.campaignId}
                </Link>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </td>
            <td className={`${cell} max-w-72`}>
              {record.ip || record.device ? (
                <p className="truncate text-gray-700" title={[record.ip, record.device].filter(Boolean).join(" · ")}>
                  {[record.ip, record.device].filter(Boolean).join(" · ")}
                </p>
              ) : (
                <span className="text-gray-400">Not captured</span>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  );
};
