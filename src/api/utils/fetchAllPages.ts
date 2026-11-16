import type { PagedResult } from "@/api/types/response";

/** The largest `pageSize` the admin list endpoints accept. */
export const MAX_PAGE_SIZE = 100;

/** Fetches page 1, then the remaining pages in parallel, and returns every page. */
export const fetchAllPages = async <P extends PagedResult<unknown>>(getPage: (page: number) => Promise<P>) => {
  const first = await getPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => getPage(i + 2)),
  );
  return [first, ...rest];
};
