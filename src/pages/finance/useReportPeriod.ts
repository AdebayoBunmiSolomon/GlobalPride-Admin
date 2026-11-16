import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { FinanceRange } from "@/api/services/finance";
import { dateRangeOptions, getDateFrom } from "@/utils/dateRange";

const DEFAULT_PERIOD = "30";

/** Local "YYYY-MM-DD". */
const toDay = (time: number) => new Date(time).toLocaleDateString("en-CA");

/** The `from` / `to` days the API takes for a period option ("all" sends neither). */
export const periodRange = (period: string): FinanceRange =>
  period === "all" ? {} : { from: toDay(getDateFrom(period)), to: toDay(Date.now()) };

/**
 * Reporting period, kept in `?period=` so it carries between the overview and
 * each report. Also returns the report page (`?page=`) and the API date range.
 */
export const useReportPeriod = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("period");
  const period = dateRangeOptions.some((option) => option.value === param) ? param! : DEFAULT_PERIOD;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const range = useMemo(() => periodRange(period), [period]);

  const setPeriod = (value: string) =>
    setSearchParams(value === DEFAULT_PERIOD ? {} : { period: value }, { replace: true });

  const setPage = (value: number) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value <= 1) next.delete("page");
        else next.set("page", String(value));
        return next;
      },
      { replace: true },
    );

  /** Appends the current period to a finance link. */
  const withPeriod = (path: string) => (period === DEFAULT_PERIOD ? path : `${path}?period=${period}`);

  return { period, range, page, setPeriod, setPage, withPeriod };
};
