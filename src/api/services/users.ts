import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import type { AdminUserActivityQuery, AdminUsersQuery } from "@/api/types/request";
import type {
  ActivityItem,
  AdminResponse,
  AdminUser,
  AdminUserDetails,
  AdminUserStatus,
  PagedResult,
} from "@/api/types/response";

/** Drops empty values so they aren't sent as `?search=`. */
const cleanParams = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

/** Admin User Management (`/admin/users`). Every call rejects with a normalized `ApiError`. */
export const usersService = {
  /** Users, newest first. */
  list: async (query: AdminUsersQuery, signal?: AbortSignal) => {
    const { data } = await apiClient.get<AdminResponse<PagedResult<AdminUser>>>("/admin/users", {
      params: cleanParams(query),
      signal,
      useAuth: true,
    });
    return unwrap(data, "We couldn't load users.");
  },

  /**
   * Every user, newest first: fetches all pages at the API's maximum page size
   * (100). Search, filtering, sorting and paging are then done in the browser.
   */
  listAll: async (signal?: AbortSignal): Promise<AdminUser[]> => {
    const pageSize = 100;
    const first = await usersService.list({ page: 1, pageSize }, signal);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
        usersService.list({ page: i + 2, pageSize }, signal),
      ),
    );
    return [first, ...rest].flatMap((page) => page.items);
  },

  /** Rejects with status 404 / code USER_NOT_FOUND for an unknown id. */
  get: async (id: string, signal?: AbortSignal) => {
    const { data } = await apiClient.get<AdminResponse<AdminUserDetails>>(`/admin/users/${id}`, {
      signal,
      useAuth: true,
    });
    return unwrap(data, "We couldn't load this user.");
  },

  activity: async (id: string, query: AdminUserActivityQuery, signal?: AbortSignal) => {
    const { data } = await apiClient.get<AdminResponse<PagedResult<ActivityItem>>>(`/admin/users/${id}/activity`, {
      params: cleanParams(query),
      signal,
      useAuth: true,
    });
    return unwrap(data, "We couldn't load this user's activity.");
  },

  /** Blocks sign-in and signs the user out of every device. Their data is kept. */
  suspend: async (id: string) => {
    const { data } = await apiClient.post<AdminResponse<{ id: string; status: AdminUserStatus }>>(
      `/admin/users/${id}/suspend`,
      undefined,
      { useAuth: true },
    );
    return { ...unwrap(data, "We couldn't suspend this user."), message: data.message };
  },

  activate: async (id: string) => {
    const { data } = await apiClient.post<AdminResponse<{ id: string; status: AdminUserStatus }>>(
      `/admin/users/${id}/activate`,
      undefined,
      { useAuth: true },
    );
    return { ...unwrap(data, "We couldn't activate this user."), message: data.message };
  },

  /** Lets a restricted user send and schedule campaigns again. */
  liftRestriction: async (id: string) => {
    const { data } = await apiClient.post<AdminResponse<{ id: string; restricted: boolean }>>(
      `/admin/users/${id}/lift-restriction`,
      undefined,
      { useAuth: true },
    );
    return { ...unwrap(data, "We couldn't lift this restriction."), message: data.message };
  },

  /**
   * Permanently deletes a user. Rejects with status 409 if the user has wallet
   * transactions or sent campaigns (financial records); suspend them instead.
   */
  remove: async (id: string) => {
    const { data } = await apiClient.delete<AdminResponse<{ id: string }>>(`/admin/users/${id}`, { useAuth: true });
    return { ...unwrap(data, "We couldn't delete this user."), message: data.message };
  },
};
