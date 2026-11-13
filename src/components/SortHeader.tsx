import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/utils/cn";

export interface SortState<K extends string> {
  key: K;
  direction: "asc" | "desc";
}

interface WebAppSortHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}

/** A sortable `<th>`: click to sort by this column, click again to flip direction. */
export const WebAppSortHeader = <K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: WebAppSortHeaderProps<K>) => {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-5 py-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-semibold hover:text-gray-900"
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-gray-400")} />
      </button>
    </th>
  );
};
