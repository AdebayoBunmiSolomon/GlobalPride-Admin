import { usersService } from "@/api/services/users";
import type { AdminUser, AdminUserDetails } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";
import { dashboardQuery } from "./dashboardStore";

/** Every user (all pages), searched / filtered / sorted / paged in the browser. */
export const userListQuery = createQueryStore(() => usersService.listAll(), { keyOf: () => "all" });

/** GET /admin/users/{id}. */
export const userDetailsQuery = createQueryStore((id: string) => usersService.get(id), { keyOf: (id) => id });

/** GET /admin/users/{id}/activity, per user, type filter and page. */
export const userActivityQuery = createQueryStore(
  (id: string, type: string | undefined, page: number, pageSize: number) =>
    usersService.activity(id, { type, page, pageSize }),
  { keyOf: (id, type, page, pageSize) => `${id}|${type ?? "all"}|${page}|${pageSize}`, staleTime: 60_000 },
);

export const useUserList = () => userListQuery.useQuery();
export const useUserDetails = (id: string) => userDetailsQuery.useQuery(id);
export const useUserActivity = (id: string, type: string | undefined, page: number, pageSize: number) =>
  userActivityQuery.useQuery(id, type, page, pageSize);

/** Applies a change to a user everywhere they're cached (list + details). */
const updateCachedUser = (id: string, changes: Partial<AdminUser>) => {
  userListQuery.setData([], (users) => users.map((user) => (user.id === id ? { ...user, ...changes } : user)));
  userDetailsQuery.setData([id], (user): AdminUserDetails => ({ ...user, ...changes }));
  // Suspended-user and user counts on the dashboard are now out of date.
  dashboardQuery.invalidate();
};

/*
 * User actions: call the API, then update the cache so every page reflects the
 * change without refetching. Each rejects with the API's `ApiError`.
 */

export const suspendUser = async (id: string) => {
  const { status, message } = await usersService.suspend(id);
  updateCachedUser(id, { status });
  return message;
};

export const activateUser = async (id: string) => {
  const { status, message } = await usersService.activate(id);
  updateCachedUser(id, { status });
  return message;
};

export const liftUserRestriction = async (id: string) => {
  const { restricted, message } = await usersService.liftRestriction(id);
  updateCachedUser(id, { restricted });
  return message;
};

export const deleteUser = async (id: string) => {
  const { message } = await usersService.remove(id);
  userListQuery.setData([], (users) => users.filter((user) => user.id !== id));
  userDetailsQuery.remove([id]);
  dashboardQuery.invalidate();
  return message;
};
