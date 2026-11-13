import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Headset, Inbox, LoaderCircle, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useSupport } from "@/hooks/useSupport";
import { formatDate } from "@/utils/format";
import { SupportTabs, TicketPriorityBadge, TicketStatusBadge } from "./SupportParts";
import {
  ticketCategoryFilterOptions,
  ticketCategoryLabels,
  ticketPriorityFilterOptions,
  ticketStatusFilterOptions,
} from "./supportOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const SupportTickets = () => {
  const tickets = useSupport((state) => state.tickets);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const count = (...statuses: string[]) => tickets.filter((ticket) => statuses.includes(ticket.status)).length;
    return {
      total: tickets.length,
      open: count("open"),
      inProgress: count("in_progress"),
      resolved: count("resolved", "closed"),
    };
  }, [tickets]);

  // TODO: move search / filters / paging to the API once the support endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets
      .filter(
        (ticket) =>
          (status === "all" || ticket.status === status) &&
          (category === "all" || ticket.category === category) &&
          (priority === "all" || ticket.priority === priority) &&
          (!query ||
            [ticket.id, ticket.userName, ticket.userId, ticket.subject].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tickets, search, status, category, priority]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTickets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <WebAppPageHeader
          title="Support"
          description="Manage user requests, support content and frequently asked questions."
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Support" }]}
        />
        <div className="-mt-2">
          <SupportTabs />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total Tickets"
          value={stats.total.toLocaleString()}
          note="All support tickets recorded."
          icon={Headset}
        />
        <WebAppStatCard
          label="Open Tickets"
          value={stats.open.toLocaleString()}
          note="New tickets awaiting action."
          icon={Inbox}
        />
        <WebAppStatCard
          label="In Progress"
          value={stats.inProgress.toLocaleString()}
          note="Tickets currently being worked on."
          icon={LoaderCircle}
        />
        <WebAppStatCard
          label="Resolved Tickets"
          value={stats.resolved.toLocaleString()}
          note="Tickets that have been resolved or closed."
          icon={CircleCheck}
        />
      </div>

      <WebAppCard title="Support Tickets" description="View and manage user support requests." bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="ticketSearch"
            type="search"
            placeholder="Search ticket ID, user or subject"
            aria-label="Search ticket ID, user or subject"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="ticketStatus"
            options={ticketStatusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="ticketCategory"
            options={ticketCategoryFilterOptions}
            value={category}
            onChange={withPageReset(setCategory)}
            fullWidth={false}
            containerClassName="w-full sm:w-48"
          />
          <WebAppSelectInput
            id="ticketPriority"
            options={ticketPriorityFilterOptions}
            value={priority}
            onChange={withPageReset(setPriority)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        </div>

        {pageTickets.length === 0 ? (
          <WebAppEmptyState
            icon={<Headset className="h-6 w-6" />}
            title="No tickets found"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Ticket ID</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Subject</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Priority</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Created</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap text-gray-900">{ticket.id}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/users/${ticket.userId}`} className={linkClass}>
                        {ticket.userName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{ticket.subject}</td>
                    <td className="px-5 py-3.5 text-gray-700">{ticketCategoryLabels[ticket.category]}</td>
                    <td className="px-5 py-3.5">
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatDate(ticket.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/support/tickets/${ticket.id}`} className={linkClass}>
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
            itemLabel="tickets"
          />
        )}
      </WebAppCard>
    </div>
  );
};
