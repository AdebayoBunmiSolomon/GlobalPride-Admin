import { RefreshCw } from "lucide-react";

import { cn } from "@/utils/cn";

export const RefreshButton = ({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    aria-label={label}
    title="Refresh"
    className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
  </button>
);

/** Placeholder rows while a table loads. */
export const TableSkeleton = ({ rows = 6, label }: { rows?: number; label: string }) => (
  <div className="space-y-2 p-5" aria-busy="true" aria-label={label}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100" />
    ))}
  </div>
);
