import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserX } from "lucide-react";

import { WebAppAvatar } from "@/components/Avatar";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSortHeader, type SortState } from "@/components/SortHeader";
import { useUsers } from "@/hooks/useUsers";
import type { PlatformUser } from "@/types/user";
import { formatDate, formatNaira } from "@/utils/format";
import { UserStatusBadge } from "./UserStatusBadge";

const PAGE_SIZE = 10;

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

type SortKey = "name" | "walletBalance" | "joinedAt";

const compareUsers = (a: PlatformUser, b: PlatformUser, key: SortKey) => {
  if (key === "walletBalance") return a.walletBalance - b.walletBalance;
  if (key === "joinedAt") return a.joinedAt.localeCompare(b.joinedAt);
  return a.name.localeCompare(b.name);
};

export const Users = () => {
  const users = useUsers((state) => state.users);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "joinedAt", direction: "desc" });
  const [page, setPage] = useState(1);

  // TODO: move search / filter / sort / paging to the API once the users endpoint exists.
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((user) => status === "all" || user.status === status)
      .filter(
        (user) =>
          !query ||
          [user.name, user.email, user.phone].some((field) =>
            field.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => {
        const result = compareUsers(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [users, search, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" },
    );
    setPage(1);
  };

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
        description={`${filteredUsers.length.toLocaleString()} users`}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <WebAppInput
              id="userSearch"
              type="search"
              placeholder="Search users..."
              aria-label="Search users"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-72"
            />
            <WebAppSelectInput
              id="userStatus"
              options={statusOptions}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-36"
            />
          </div>
        }
      >
        {pageUsers.length === 0 ? (
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="No users found"
            description="Try a different search term or status filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <WebAppSortHeader label="User" sortKey="name" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-5 py-3 font-semibold">Contact</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Campaigns</th>
                  <WebAppSortHeader
                    label="Wallet Balance"
                    sortKey="walletBalance"
                    sort={sort}
                    onSort={handleSort}
                  />
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
                    <td className="px-5 py-3.5 text-gray-700">{user.phone}</td>
                    <td className="px-5 py-3.5 text-gray-700">{user.campaigns}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {formatNaira(user.walletBalance)}
                    </td>
                    <td className="px-5 py-3.5">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDate(user.joinedAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/users/${user.id}`}
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

        {filteredUsers.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredUsers.length}
            onPageChange={setPage}
            itemLabel="users"
          />
        )}
      </WebAppCard>
    </div>
  );
};
