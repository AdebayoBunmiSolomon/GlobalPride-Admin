import { apiClient } from "@/api/axios/client";
import { normalizeResponse, unwrap } from "@/api/utils";
import type { AudienceRecordsQuery, DeleteAudienceRecordsQuery } from "@/api/types/request";
import type {
  AdminResponse,
  AudienceGender,
  AudienceLgaRow,
  AudienceRecord,
  AudienceStateRow,
  AudienceSummary,
  AudienceUploadFileResult,
  PagedResult,
} from "@/api/types/response";

/*
 * Swagger documents no response body for records or uploads, so those are read
 * defensively: each field is taken from the first of a few likely names. Once
 * the backend documents them, replace these readers with plain types.
 */
type Raw = Record<string, unknown>;

const pick = (raw: Raw, ...names: string[]) => names.map((name) => raw[name]).find((value) => value != null);
const text = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  return value == null || value === "" ? null : String(value);
};
const count = (raw: Raw, ...names: string[]) => {
  const value = Number(pick(raw, ...names));
  return Number.isFinite(value) ? value : 0;
};

const toGender = (value: string | null): AudienceGender => {
  const lower = value?.toLowerCase();
  return lower === "male" || lower === "m" ? "male" : lower === "female" || lower === "f" ? "female" : "unknown";
};

const toRecord = (raw: Raw): AudienceRecord => {
  let firstName = text(raw, "firstName");
  let lastName = text(raw, "lastName", "surname");
  const fullName = text(raw, "name", "fullName");
  if (!firstName && !lastName && fullName) {
    [firstName, lastName] = [fullName.split(" ")[0], fullName.split(" ").slice(1).join(" ") || null];
  }
  return {
    id: String(pick(raw, "id") ?? ""),
    phoneNumber: text(raw, "phoneNumber", "phone", "msisdn") ?? "—",
    firstName,
    lastName,
    state: text(raw, "state", "stateName"),
    lga: text(raw, "lga", "localGovernment", "lgaName"),
    gender: toGender(text(raw, "gender")),
    createdAt: text(raw, "createdAt", "importedAt", "uploadedAt", "addedAt"),
  };
};

/** Reasons may come as strings or `{ row, reason }` objects. */
const toReasons = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => {
        if (typeof item !== "object" || item === null) return String(item);
        const row = pick(item as Raw, "row", "rowNumber", "line");
        const reason = text(item as Raw, "reason", "message", "error") ?? JSON.stringify(item);
        return row != null ? `Row ${row}: ${reason}` : reason;
      })
    : [];

const toFileResult = (raw: Raw, fallbackName: string): AudienceUploadFileResult => ({
  fileName: text(raw, "fileName", "file", "name") ?? fallbackName,
  added: count(raw, "added", "addedRows", "imported", "totalImported", "inserted"),
  alreadyStored: count(raw, "alreadyStored", "existing", "alreadyExists", "skippedExisting"),
  repeated: count(raw, "repeated", "duplicates", "duplicatesInFile"),
  rejected: count(raw, "rejected", "invalid", "rejectedRows"),
  reasons: [
    ...toReasons(pick(raw, "rejections", "rejectedRows", "reasons", "errors")),
    ...(text(raw, "error") ? [text(raw, "error")!] : []),
  ],
});

/** Upload result: an array of per-file results, or an object holding one. */
const toUploadResults = (result: unknown, files: File[]): AudienceUploadFileResult[] => {
  const list = Array.isArray(result)
    ? result
    : result && typeof result === "object"
      ? (pick(result as Raw, "files", "results", "items") as unknown[] | undefined) ?? [result]
      : [];
  return list.map((item, index) => toFileResult((item ?? {}) as Raw, files[index]?.name ?? `File ${index + 1}`));
};

/** Drops empty values so they aren't sent as `?search=`. */
const cleanParams = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ""));

/** Admin Audience Marketplace (`/admin/audience`). Every call rejects with a normalized `ApiError`. */
export const audienceService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<AudienceSummary>>("/admin/audience/summary", { useAuth: true });
    return unwrap(data, "We couldn't load the audience summary.");
  },

  /** Every state and FCT, including those with no contacts (zero counts). */
  states: async () => {
    const { data } = await apiClient.get<AdminResponse<AudienceStateRow[]>>("/admin/audience/states", {
      useAuth: true,
    });
    return unwrap(data, "We couldn't load states.");
  },

  /** The LGAs of one state that have contacts loaded. `state` is its name. */
  lgas: async (state: string) => {
    const { data } = await apiClient.get<AdminResponse<AudienceLgaRow[]>>(
      `/admin/audience/states/${encodeURIComponent(state)}/lgas`,
      { useAuth: true },
    );
    return unwrap(data, "We couldn't load LGAs.");
  },

  /** Contacts, newest first, filtered and paged by the API. */
  records: async (query: AudienceRecordsQuery): Promise<PagedResult<AudienceRecord>> => {
    const { data } = await apiClient.get<AdminResponse<PagedResult<Raw>>>("/admin/audience/records", {
      params: cleanParams(query),
      useAuth: true,
    });
    const page = unwrap(data, "We couldn't load audience records.");
    return { ...page, items: page.items.map(toRecord) };
  },

  record: async (id: string) => {
    const { data } = await apiClient.get<AdminResponse<Raw>>(`/admin/audience/records/${encodeURIComponent(id)}`, {
      useAuth: true,
    });
    return toRecord(unwrap(data, "We couldn't load this record."));
  },

  /** Removes every stored contact of one state, or of one LGA in it. */
  deleteRecords: async (query: DeleteAudienceRecordsQuery) => {
    const { data } = await apiClient.delete<AdminResponse<unknown>>("/admin/audience/records", {
      params: cleanParams(query),
      useAuth: true,
    });
    // A successful delete may carry no `result`, which `unwrap` would reject.
    const response = normalizeResponse(data);
    if (!response.success) unwrap(data, "We couldn't delete these records.");
    const result = response.data;
    const deleted = result && typeof result === "object" ? pick(result as Raw, "deleted", "removed", "count") : result;
    return { deleted: typeof deleted === "number" ? deleted : null, message: data.message };
  },

  /**
   * Uploads .csv / .xlsx files (multipart). Each file is loaded on its own;
   * re-uploading is safe because stored numbers are skipped.
   */
  upload: async (files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const { data } = await apiClient.post<AdminResponse<unknown>>("/admin/audience/upload", form, {
      useAuth: true,
      // Large spreadsheets take a while to import.
      timeout: 5 * 60_000,
    });
    return { files: toUploadResults(unwrap(data, "We couldn't upload these files."), files), message: data.message };
  },
};
