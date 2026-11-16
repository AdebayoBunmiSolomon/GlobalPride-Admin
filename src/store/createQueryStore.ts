import { useCallback, useEffect } from "react";
import { create } from "zustand";

import type { ApiError } from "@/api/types/response";

/** One cached request result. */
export interface QueryEntry<T> {
  data: T | null;
  error: ApiError | null;
  /** When `data` was last fetched (ms), 0 if never. */
  fetchedAt: number;
  /** A request for this key is in flight. */
  loading: boolean;
}

interface QueryStoreOptions<A extends unknown[]> {
  /** Cache key for a set of arguments. Defaults to `JSON.stringify(args)`. */
  keyOf?: (...args: A) => string;
  /** How long fetched data counts as fresh (ms). Stale data is still shown, then refreshed in the background. */
  staleTime?: number;
}

interface FetchOptions {
  /** Refetch even if the cached data is still fresh. */
  force?: boolean;
}

const DEFAULT_STALE_TIME = 5 * 60_000;

const emptyEntry: QueryEntry<never> = { data: null, error: null, fetchedAt: 0, loading: false };

/** Every query store, so they can all be cleared on sign-out. */
const registry = new Set<() => void>();

/** Clears every cached query (called when the admin signs out). */
export const resetQueryStores = () => registry.forEach((reset) => reset());

/**
 * A cache for one API call, keyed by its arguments. Components read it with
 * `useQuery(...args)`: cached data is returned immediately, fetched only when
 * missing or older than `staleTime`, and concurrent callers share one request.
 * Mutations update cached results in place with `setData`, or mark them for
 * refetching with `invalidate`.
 */
export const createQueryStore = <T, A extends unknown[]>(
  fetcher: (...args: A) => Promise<T>,
  { keyOf = (...args) => JSON.stringify(args), staleTime = DEFAULT_STALE_TIME }: QueryStoreOptions<A> = {},
) => {
  const useEntries = create<Record<string, QueryEntry<T>>>(() => ({}));
  const inFlight = new Map<string, Promise<T | null>>();
  /** Bumped by `reset` so results of requests started before it are dropped. */
  let generation = 0;

  const patch = (key: string, changes: Partial<QueryEntry<T>>) =>
    useEntries.setState((entries) => ({ ...entries, [key]: { ...(entries[key] ?? emptyEntry), ...changes } }));

  const isFresh = (entry: QueryEntry<T> | undefined) =>
    Boolean(entry?.data) && Date.now() - (entry?.fetchedAt ?? 0) < staleTime;

  /** Fetches (or reuses) the data for `args`. Resolves to the data, or null if the request failed. */
  const fetch = (args: A, { force = false }: FetchOptions = {}): Promise<T | null> => {
    const key = keyOf(...args);
    const entry = useEntries.getState()[key];

    if (!force && isFresh(entry)) return Promise.resolve(entry!.data);
    const pending = inFlight.get(key);
    if (pending) return pending;

    const started = generation;
    patch(key, { loading: true });

    const request = fetcher(...args)
      .then((data) => {
        if (started === generation) patch(key, { data, error: null, fetchedAt: Date.now(), loading: false });
        return data;
      })
      .catch((error: ApiError) => {
        if (started === generation) patch(key, { error, loading: false });
        return null;
      })
      .finally(() => inFlight.delete(key));

    inFlight.set(key, request);
    return request;
  };

  /** Updates cached data for `args` in place (no-op if nothing is cached). */
  const setData = (args: A, update: (current: T) => T) => {
    const key = keyOf(...args);
    const entry = useEntries.getState()[key];
    if (entry?.data) patch(key, { data: update(entry.data) });
  };

  /** Updates every cached result (e.g. a user changed on every page that lists them). */
  const setAllData = (update: (current: T) => T) =>
    useEntries.setState((entries) =>
      Object.fromEntries(
        Object.entries(entries).map(([key, entry]) => [key, entry.data ? { ...entry, data: update(entry.data) } : entry]),
      ),
    );

  /** Removes cached data for `args`. */
  const remove = (args: A) =>
    useEntries.setState((entries) => {
      const next = { ...entries };
      delete next[keyOf(...args)];
      return next;
    });

  /**
   * Marks cached data stale so the next `useQuery` / `fetch` refetches it, while
   * still showing the old data meanwhile. Without `args`, marks everything stale.
   */
  const invalidate = (args?: A) =>
    useEntries.setState((entries) =>
      Object.fromEntries(
        Object.entries(entries).map(([key, entry]) =>
          !args || key === keyOf(...args) ? [key, { ...entry, fetchedAt: 0 }] : [key, entry],
        ),
      ),
    );

  const reset = () => {
    generation += 1;
    inFlight.clear();
    useEntries.setState({}, true);
  };
  registry.add(reset);

  /** Cached data for `args`, fetched on mount / when `args` change if missing or stale. */
  const useQuery = (...args: A) => {
    const key = keyOf(...args);
    const entry = useEntries((entries) => entries[key]) ?? (emptyEntry as QueryEntry<T>);

    useEffect(() => {
      void fetch(args);
      // `key` captures `args`.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const refresh = useCallback(
      () => fetch(args, { force: true }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [key],
    );

    return {
      data: entry.data,
      /** Only set when the latest request failed. */
      error: entry.loading ? null : entry.error,
      /** True while any request for this key is in flight (including background refreshes). */
      loading: entry.loading || (!entry.data && !entry.error),
      fetchedAt: entry.fetchedAt,
      /** Refetches now, ignoring the cache. */
      refresh,
    };
  };

  return { useQuery, fetch, setData, setAllData, remove, invalidate, reset };
};
