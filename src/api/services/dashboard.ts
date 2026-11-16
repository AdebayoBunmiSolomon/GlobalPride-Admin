import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import type { AdminResponse, DashboardRange, DashboardSummary } from "@/api/types/response";

export const dashboardService = {
  /** Platform overview for the dashboard. Rejects with a normalized `ApiError`. */
  getSummary: async (range: DashboardRange, signal?: AbortSignal): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<AdminResponse<DashboardSummary>>("/admin/dashboard", {
      params: { range },
      signal,
      useAuth: true,
    });
    return unwrap(data, "We couldn't load the dashboard.");
  },
};
