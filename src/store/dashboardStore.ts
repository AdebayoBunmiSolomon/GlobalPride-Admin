import { dashboardService } from "@/api/services/dashboard";
import type { DashboardRange } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/dashboard per range. Kept for 2 minutes; user changes (suspend, delete) mark it stale. */
export const dashboardQuery = createQueryStore((range: DashboardRange) => dashboardService.getSummary(range), {
  keyOf: (range) => range,
  staleTime: 2 * 60_000,
});

export const useDashboardSummary = dashboardQuery.useQuery;
