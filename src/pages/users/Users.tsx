import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, RefreshCw, Search, UserX } from "lucide-react";

import type { AdminUser } from "@/api/types/response";
import { WebAppAvatar } from "@/components/Avatar";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSortHeader, type SortState } from "@/components/SortHeader";
import { useListParams } from "@/hooks/useListParams";
import { useUserList } from "@/store/usersStore";
import { cn } from "@/utils/cn";
import { formatDate, formatNaira, parseApiDate } from "@/utils/format";
import { UserStatusBadge } from "./UserStatusBadge";

const PAGE_SIZE = 20;

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Restricted", value: "restricted" },
];

type SortKey = "name" | "campaigns" | "walletBalance" | "joinedAt";
const sortKeys: SortKey[] = ["name", "campaigns", "walletBalance", "joinedAt"];

const compareUsers = (a: AdminUser, b: AdminUser, key: SortKey) => {
  if (key === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (key === "joinedAt") return a.joinedAt.localeCompare(b.joinedAt);
  return a[key] - b[key];
};

/** Digits only, with a Nigerian leading 0 read as 234, so "0803…" matches "+234803…". */
const phoneDigits = (value: string) => value.replace(/\D/g, "").replace(/^0/, "234");

const matchesSearch = (user: AdminUser, query: string) => {
  const text = query.toLowerCase();
  if ([user.name, user.email].some((field) => field?.toLowerCase().includes(text))) return true;
  const digits = phoneDigits(query);
  if (!user.phone || digits.length < 3) return false;
  return phoneDigits(user.phone).includes(digits) || user.phone.replace(/\D/g, "").includes(query.replace(/\D/g, ""));
};

export const Users = () => {
  // Filters live in the URL so "Back to Users" returns to the same view.
  const { get, update: updateParams, page: requestedPage } = useListParams({ status: "all", page: "1" });
  const search = get("q");
  const status = statusOptions.find((option) => option.value === get("status"))?.value ?? "all";
  const sortKey = sortKeys.find((key) => key === get("sort")) ?? "joinedAt";
  const sort: SortState<SortKey> = {
    key: sortKey,
    direction: get("dir") === "asc" ? "asc" : get("dir") === "desc" ? "desc" : sortKey === "name" ? "asc" : "desc",
  };

  // Fetched once and cached (see src/store); everything below runs in the browser.
  const { data: users, error, loading, fetchedAt, refresh } = useUserList();

  const filteredUsers = useMemo(() => {
    const query = search.trim();
    return (users ?? [])
      .filter((user) =>
        status === "all" ? true : status === "restricted" ? user.restricted : user.status === status,
      )
      .filter((user) => !query || matchesSearch(user, query))
      .sort((a, b) => {
        const result = compareUsers(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [users, search, status, sort.key, sort.direction]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) =>
    updateParams({
      sort: key,
      dir: sort.key === key ? (sort.direction === "asc" ? "desc" : "asc") : key === "name" ? "asc" : "desc",
      page: null,
    });

  const total = users?.length ?? 0;
  const description = !users
    ? "Loading users…"
    : filteredUsers.length === total
      ? `${total.toLocaleString()} ${total === 1 ? "user" : "users"}`
      : `${filteredUsers.length.toLocaleString()} of ${total.toLocaleString()} users`;

  return (
    <div>
      <WebAppPageHeader
        title="User Management"
        description="View and manage platform users."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "User Management" }]}
      />

      <WebAppCard
        divided
        title="Users"
        description={description}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <WebAppInput
              id="userSearch"
              type="search"
              placeholder="Search name, email or phone..."
              aria-label="Search users"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => updateParams({ q: event.target.value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-72"
            />
            <WebAppSelectInput
              id="userStatus"
              aria-label="Status"
              options={statusOptions}
              value={status}
              onChange={(value) => updateParams({ status: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-36"
            />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh users"
              title={fetchedAt ? `Last updated ${new Date(fetchedAt).toLocaleTimeString()}` : "Refresh"}
              className="rounded-lg border border-gray-200 px-3 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        }
      >
        {error && !users ? (
          <WebAppEmptyState
            icon={<CircleAlert className="h-6 w-6" />}
            title="Couldn't load users"
            description={error.message}
            primaryAction={{ label: "Try again", onClick: refresh }}
          />
        ) : !users ? (
          <div className="space-y-px" aria-busy="true" aria-label="Loading users">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : pageUsers.length === 0 ? (
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="No users found"
            description={search || status !== "all" ? "Try a different search term or status filter." : "No one has signed up yet."}
          />
        ) : (
          <>
            {error && (
              <div role="alert" className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-2.5 text-sm text-red-700">
                <CircleAlert className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error.message} Showing the last loaded users.</span>
                <button type="button" onClick={refresh} className="font-medium hover:underline">
                  Retry
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left text-sm">
                <thead className="border-b border-gray-200 text-xs text-gray-600">
                  <tr>
                    <WebAppSortHeader label="User" sortKey="name" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Phone</th>
                    <WebAppSortHeader label="Campaigns" sortKey="campaigns" sort={sort} onSort={handleSort} />
                    <WebAppSortHeader label="Wallet Balance" sortKey="walletBalance" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <WebAppSortHeader label="Joined" sortKey="joinedAt" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <WebAppAvatar name={user.name} variant="soft" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="truncate text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{user.phone || "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{user.campaigns.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{formatNaira(user.walletBalance)}</td>
                      <td className="px-5 py-3.5">
                        <UserStatusBadge status={user.status} restricted={user.restricted} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{formatDate(parseApiDate(user.joinedAt))}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/users/${user.id}`} className="font-medium text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <WebAppPagination
              className="border-t border-gray-200 px-5 py-4"
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredUsers.length}
              onPageChange={(next) => updateParams({ page: next })}
              itemLabel="users"
            />
          </>
        )}
      </WebAppCard>
    </div>
  );
};
