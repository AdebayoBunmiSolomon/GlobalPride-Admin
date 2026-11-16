import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * List filters (search, status, sort, page…) kept in the URL, so "Back to …"
 * links and reloads return to the same view. `update` merges changes; a value
 * equal to its default in `defaults` (or null / "") is removed from the URL.
 */
export const useListParams = (defaults: Record<string, string> = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = (name: string) => searchParams.get(name) ?? defaults[name] ?? "";

  const update = useCallback(
    (changes: Record<string, string | number | null>) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [name, value] of Object.entries(changes)) {
            const text = value === null ? "" : String(value);
            if (text === "" || text === defaults[name]) next.delete(name);
            else next.set(name, text);
          }
          return next;
        },
        { replace: true },
      ),
    // `defaults` is a constant object literal in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams],
  );

  /** Current page from `?page=`, at least 1. */
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  return { get, update, page };
};
