import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CircleAlert, CircleX, Plus, Search, Send } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { useSettings } from "@/hooks/useSettings";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { ListLoadState } from "@/pages/support/SupportParts";
import { announcementSummaryQuery, useAnnouncementList, useAnnouncementSummary } from "@/store/announcementsStore";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { NotificationStatusBadge } from "./NotificationParts";
import { statusFilterOptions } from "./notificationOptions";

const PAGE_SIZE = 10;

const when = (value: string | null) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

export const Notifications = () => {
  const navigate = useNavigate();
  const announcementsAllowed = useSettings((state) => state.notifications.adminAnnouncements);
  const { get, update, page: requestedPage } = useListParams({ status: "all", page: "1" });
  const search = get("q");
  const status = get("status");

  const { data: summary } = useAnnouncementSummary();
  const { data: announcements, error, loading, refresh } = useAnnouncementList();

  // The summary body isn't documented; fall back to counting the list.
  const stats = useMemo(() => {
    const counted = (value: string) => announcements?.filter((item) => item.status === value).length ?? null;
    return {
      total: summary?.total ?? announcements?.length ?? null,
      sent: summary?.sent ?? counted("sent"),
      scheduled: summary?.scheduled ?? counted("scheduled"),
      cancelled: summary?.cancelled ?? counted("cancelled"),
      sending: summary?.sending ?? counted("sending"),
    };
  }, [summary, announcements]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (announcements ?? [])
      .filter(
        (item) =>
          (status === "all" || item.status === status) &&
          (!query || [item.code, item.title, item.message].some((value) => value.toLowerCase().includes(query))),
      )
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || Number(b.id) - Number(a.id));
  }, [announcements, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const refreshAll = () => {
    void announcementSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const count = (value: number | null) => (value === null ? "…" : value.toLocaleString());
  const total = announcements?.length ?? 0;

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Notifications"
        description="Send and schedule announcements to every Global Pride user."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Notifications" }]}
        actions={
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <RefreshButton label="Refresh notifications" loading={loading} onClick={refreshAll} />
              <WebAppButton
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={!announcementsAllowed}
                onClick={() => navigate("/notifications/new")}
              >
                Create Notification
              </WebAppButton>
            </div>
            {!announcementsAllowed && (
              <p className="text-xs text-gray-500">
                Admin announcements are turned off in{" "}
                <Link to="/settings/notifications" className="font-medium text-primary hover:underline">
                  Settings
                </Link>
                .
              </p>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard label="Total Announcements" value={count(stats.total)} note="All announcements recorded." icon={Bell} />
        <WebAppStatCard
          label="Sent"
          value={count(stats.sent)}
          note={stats.sending ? `${stats.sending.toLocaleString()} sending now.` : "Delivered to users."}
          icon={Send}
        />
        <WebAppStatCard label="Scheduled" value={count(stats.scheduled)} note="Queued for a future time." icon={CalendarClock} />
        <WebAppStatCard
          label="Cancelled"
          value={count(stats.cancelled)}
          note="Cancelled before sending."
          icon={CircleX}
          tone="red"
        />
      </div>

      <WebAppCard
        title="Announcements"
        description={
          !announcements
            ? "Announcements sent to all users."
            : filtered.length === total
              ? `${total.toLocaleString()} announcements · newest first`
              : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} announcements`
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="notificationSearch"
            type="search"
            placeholder="Search code, title or message"
            aria-label="Search code, title or message"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="notificationStatus"
            options={statusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
        </div>

        {error && announcements && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh announcements: {error.message}
          </p>
        )}

        {!announcements ? (
          <ListLoadState error={error} hasData={false} what="announcements" onRetry={refreshAll} />
        ) : pageItems.length === 0 ? (
          <WebAppEmptyState
            icon={<Bell className="h-6 w-6" />}
            title={total === 0 ? "No announcements yet" : "No announcements found"}
            description={total === 0 ? "Announcements you send or schedule appear here." : "Try a different search term or filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Announcement</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Recipients</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Sent / Scheduled For</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-100 text-gray-600">
                          <Bell className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                      All Users
                      {item.recipients !== null && (
                        <span className="text-gray-500"> · {item.recipients.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <NotificationStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(item.createdAt)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(item.sentAt ?? item.scheduledAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/notifications/${encodeURIComponent(item.code)}`}
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

        {filtered.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel="announcements"
          />
        )}
      </WebAppCard>
    </div>
  );
};
