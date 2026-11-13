import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CircleX, Plus, Search, Send } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useNotifications } from "@/hooks/useNotifications";
import { useSettings } from "@/hooks/useSettings";
import { formatDate } from "@/utils/format";
import { NotificationSourceBadge, NotificationStatusBadge } from "./NotificationParts";
import {
  notificationTypes,
  recipientLabel,
  sourceFilterOptions,
  statusFilterOptions,
  typeFilterOptions,
} from "./notificationOptions";

const PAGE_SIZE = 10;

export const Notifications = () => {
  const navigate = useNavigate();
  const notifications = useNotifications((state) => state.notifications);
  const announcementsAllowed = useSettings((state) => state.notifications.adminAnnouncements);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const count = (value: string) => notifications.filter((item) => item.status === value).length;
    return { total: notifications.length, sent: count("sent"), scheduled: count("scheduled"), cancelled: count("cancelled") };
  }, [notifications]);

  // TODO: move search / filters / paging to the API once the notifications endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications
      .filter(
        (item) =>
          (source === "all" || item.source === source) &&
          (type === "all" || item.type === type) &&
          (status === "all" || item.status === status) &&
          (!query ||
            [item.id, item.title, item.message, recipientLabel(item.recipient)].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notifications, search, source, type, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Notifications"
        description="Manage system notifications and announcements sent to Global Pride users."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Notifications" }]}
        actions={
          <div className="flex flex-col items-end gap-1">
            <WebAppButton
              leftIcon={<Plus className="h-4 w-4" />}
              disabled={!announcementsAllowed}
              onClick={() => navigate("/notifications/new")}
            >
              Create Notification
            </WebAppButton>
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
        <WebAppStatCard label="Total Notifications" value={stats.total.toLocaleString()} note="All notifications recorded." icon={Bell} />
        <WebAppStatCard label="Sent Notifications" value={stats.sent.toLocaleString()} note="Notifications sent to users." icon={Send} />
        <WebAppStatCard
          label="Scheduled Notifications"
          value={stats.scheduled.toLocaleString()}
          note="Queued for a future time."
          icon={CalendarClock}
        />
        <WebAppStatCard
          label="Cancelled Notifications"
          value={stats.cancelled.toLocaleString()}
          note="Notifications cancelled before sending."
          icon={CircleX}
          tone="red"
        />
      </div>

      <WebAppCard
        title="Notification Records"
        description="System events and admin announcements across the platform."
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="notificationSearch"
            type="search"
            placeholder="Search notification"
            aria-label="Search notification"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="notificationSource"
            options={sourceFilterOptions}
            value={source}
            onChange={withPageReset(setSource)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          <WebAppSelectInput
            id="notificationType"
            options={typeFilterOptions}
            value={type}
            onChange={withPageReset(setType)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          <WebAppSelectInput
            id="notificationStatus"
            options={statusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
        </div>

        {pageItems.length === 0 ? (
          <WebAppEmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No notifications found"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Notification</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Recipient</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((item) => {
                  const { label: typeLabel, icon: TypeIcon } = notificationTypes[item.type];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-100 text-gray-600">
                            <TypeIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <NotificationSourceBadge source={item.source} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{typeLabel}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{recipientLabel(item.recipient)}</td>
                      <td className="px-5 py-3.5">
                        <NotificationStatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/notifications/${item.id}`} className="font-medium text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
            itemLabel="notifications"
          />
        )}
      </WebAppCard>
    </div>
  );
};
