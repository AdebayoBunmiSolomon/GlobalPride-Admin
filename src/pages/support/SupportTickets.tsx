import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, CircleCheck, Headset, Inbox, LoaderCircle, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { ticketSummaryQuery, useTicketList, useTicketSummary } from "@/store/supportStore";
import { formatDate, parseApiDate } from "@/utils/format";
import { ListLoadState, RefreshButton, SupportTabs, TicketPriorityBadge, TicketStatusBadge } from "./SupportParts";
import {
  ticketCategoryFilterOptions,
  ticketCategoryLabel,
  ticketPriorityFilterOptions,
  ticketStatusFilterOptions,
} from "./supportOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

const when = (value: string) => (value ? formatDate(parseApiDate(value)) : "—");

export const SupportTickets = () => {
  // Filters live in the URL so "Back to Support" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({
    status: "all",
    category: "all",
    priority: "all",
    page: "1",
  });
  const search = get("q");
  const status = get("status");
  const category = get("category");
  const priority = get("priority");

  const { data: summary } = useTicketSummary();
  // Every ticket is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: tickets, error, loading, refresh } = useTicketList();

  // The summary endpoint's body isn't documented; fall back to counting the list.
  const stats = useMemo(() => {
    const counted = (...statuses: string[]) =>
      tickets ? tickets.filter((ticket) => statuses.includes(ticket.status)).length : null;
    const resolved =
      summary?.resolved != null || summary?.closed != null
        ? (summary.resolved ?? 0) + (summary.closed ?? 0)
        : counted("resolved", "closed");
    return {
      total: summary?.total ?? tickets?.length ?? null,
      open: summary?.open ?? counted("open"),
      inProgress: summary?.inProgress ?? counted("in_progress"),
      resolved,
    };
  }, [summary, tickets]);

  const categoryOptions = useMemo(
    () => ticketCategoryFilterOptions((tickets ?? []).map((ticket) => ticket.category)),
    [tickets],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (tickets ?? [])
      .filter(
        (ticket) =>
          (status === "all" || ticket.status === status) &&
          (category === "all" || ticket.category.toLowerCase() === category.toLowerCase()) &&
          (priority === "all" || ticket.priority === priority) &&
          (!query ||
            [ticket.reference, ticket.userName, ticket.userEmail ?? "", ticket.subject].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tickets, search, status, category, priority]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageTickets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const refreshAll = () => {
    void ticketSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const count = (value: number | null) => (value === null ? "…" : value.toLocaleString());
  const total = tickets?.length ?? 0;
  const description = !tickets
    ? "View and manage user support requests."
    : filtered.length === total
      ? `${total.toLocaleString()} tickets · newest activity first`
      : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} tickets`;

  return (
    <div className="space-y-6">
      <div>
        <WebAppPageHeader
          title="Support"
          description="Manage user requests, support content and frequently asked questions."
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Support" }]}
          actions={<RefreshButton label="Refresh support tickets" loading={loading} onClick={refreshAll} />}
        />
        <div className="-mt-2">
          <SupportTabs />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total Tickets"
          value={count(stats.total)}
          note="All support tickets recorded."
          icon={Headset}
        />
        <WebAppStatCard
          label="Open Tickets"
          value={count(stats.open)}
          note="New tickets awaiting action."
          icon={Inbox}
        />
        <WebAppStatCard
          label="In Progress"
          value={count(stats.inProgress)}
          note={
            summary?.pendingUser != null
              ? `${summary.pendingUser.toLocaleString()} more waiting on the user.`
              : "Tickets currently being worked on."
          }
          icon={LoaderCircle}
        />
        <WebAppStatCard
          label="Resolved Tickets"
          value={count(stats.resolved)}
          note="Tickets that have been resolved or closed."
          icon={CircleCheck}
        />
      </div>

      <WebAppCard title="Support Tickets" description={description} bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="ticketSearch"
            type="search"
            placeholder="Search reference, user or subject"
            aria-label="Search reference, user or subject"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="ticketStatus"
            options={ticketStatusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="ticketCategory"
            options={categoryOptions}
            value={category}
            onChange={(value) => update({ category: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-48"
          />
          <WebAppSelectInput
            id="ticketPriority"
            options={ticketPriorityFilterOptions}
            value={priority}
            onChange={(value) => update({ priority: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        </div>

        {error && tickets && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh tickets: {error.message}
          </p>
        )}

        {!tickets ? (
          <ListLoadState error={error} hasData={false} what="support tickets" onRetry={refreshAll} />
        ) : pageTickets.length === 0 ? (
          <WebAppEmptyState
            icon={<Headset className="h-6 w-6" />}
            title={total === 0 ? "No support tickets yet" : "No tickets found"}
            description={
              total === 0
                ? "Tickets reported from the app's Help & Support screen will appear here."
                : "Try a different search term or filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Reference</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Subject</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Priority</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Activity</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap text-gray-900">{ticket.reference}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {ticket.userId ? (
                        <Link to={`/users/${encodeURIComponent(ticket.userId)}`} className={linkClass}>
                          {ticket.userName}
                        </Link>
                      ) : (
                        <span className="text-gray-900">{ticket.userName}</span>
                      )}
                      {ticket.userEmail && ticket.userEmail !== ticket.userName && (
                        <p className="text-xs text-gray-500">{ticket.userEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{ticket.subject}</td>
                    <td className="px-5 py-3.5 text-gray-700">{ticketCategoryLabel(ticket.category)}</td>
                    <td className="px-5 py-3.5">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(ticket.createdAt)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(ticket.updatedAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/support/tickets/${encodeURIComponent(ticket.reference)}`} className={linkClass}>
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
            itemLabel="tickets"
          />
        )}
      </WebAppCard>
    </div>
  );
};
