import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

interface WebAppPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Noun used in the "Showing 1–10 of 24 users" summary. */
  itemLabel?: string;
  className?: string;
}

/** Page numbers to show: all of them when few, otherwise first/last + a window around the current page. */
const getPageItems = (page: number, pageCount: number): (number | "…")[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) items.push("…");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pageCount - 1) items.push("…");
  items.push(pageCount);

  return items;
};

const navButton =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent";

export const WebAppPagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = "items",
  className,
}: WebAppPaginationProps) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 text-sm",
        className,
      )}
    >
      <p className="text-gray-600">
        Showing {from}–{to} of {total.toLocaleString()} {itemLabel}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <button
          type="button"
          className={navButton}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        {getPageItems(page, pageCount).map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                "h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition-colors",
                item === page
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={navButton}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};
