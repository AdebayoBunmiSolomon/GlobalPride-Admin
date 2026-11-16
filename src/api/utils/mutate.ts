import type { AdminResponse } from "@/api/types/response";
import { normalizeResponse, unwrap } from "./isApiSuccess";

/**
 * Sends a mutation and resolves to its (possibly empty) `result` and message.
 * Rejects with an `ApiError` when the response says it failed.
 */
export const mutate = async (request: Promise<{ data: AdminResponse<unknown> }>, fallbackMessage: string) => {
  const { data } = await request;
  const response = normalizeResponse(data);
  if (!response.success) unwrap(data, fallbackMessage);
  return { result: response.data as unknown, message: data.message ?? null };
};
