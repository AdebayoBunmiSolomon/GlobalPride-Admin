import { useSearchParams } from "react-router-dom";

import { dateRangeOptions } from "@/utils/dateRange";

const DEFAULT_PERIOD = "all";

/** Reporting period, kept in `?period=` so it carries between the overview and each report. */
export const useReportPeriod = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("period");
  const period = dateRangeOptions.some((option) => option.value === param) ? param! : DEFAULT_PERIOD;

  const setPeriod = (value: string) =>
    setSearchParams(value === DEFAULT_PERIOD ? {} : { period: value }, { replace: true });

  /** Appends the current period to a finance link. */
  const withPeriod = (path: string) => (period === DEFAULT_PERIOD ? path : `${path}?period=${period}`);

  return { period, setPeriod, withPeriod };
};
