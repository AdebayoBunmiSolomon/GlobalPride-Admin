import { RefreshCw } from "lucide-react";

import { cn } from "@/utils/cn";

/** Icon button that refetches a page's data. */
export const RefreshButton = ({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) => (
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
