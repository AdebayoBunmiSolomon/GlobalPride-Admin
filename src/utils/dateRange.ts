const DAY = 24 * 60 * 60 * 1000;

export const dateRangeOptions = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
];

/** Earliest timestamp included by a date range option, or 0 for "All Time". */
export const getDateFrom = (range: string) => {
  if (range === "all") return 0;
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  return range === "today" ? startOfToday : startOfToday - (Number(range) - 1) * DAY;
};
