import { audienceService } from "@/api/services/audience";
import type { AudienceRecordsQuery, DeleteAudienceRecordsQuery } from "@/api/types/request";
import type { AudienceLgaRow } from "@/api/types/response";
import { createQueryStore } from "./createQueryStore";

/** GET /admin/audience/summary. */
export const audienceSummaryQuery = createQueryStore(() => audienceService.summary(), { keyOf: () => "summary" });

/** Every state and FCT with its counts; searched in the browser. */
export const audienceStatesQuery = createQueryStore(() => audienceService.states(), { keyOf: () => "all" });

/** One state's LGAs, by state name. */
export const audienceLgasQuery = createQueryStore((state: string) => audienceService.lgas(state), {
  keyOf: (state) => state,
});

/**
 * Every LGA with contacts: there is no all-LGAs endpoint, so this loads the
 * states, then the LGAs of each state that has any.
 */
export const allAudienceLgasQuery = createQueryStore(
  async (): Promise<AudienceLgaRow[]> => {
    const states = await audienceService.states();
    const lists = await Promise.all(
      states
        .filter((state) => state.lgaCount > 0)
        .map((state) => audienceService.lgas(state.name)),
    );
    return lists.flat();
  },
  { keyOf: () => "all" },
);

/**
 * Contacts are paged and filtered by the API (there can be far too many to load
 * at once), so each search / filter / page combination is cached separately.
 */
export const audienceRecordsQuery = createQueryStore((query: AudienceRecordsQuery) => audienceService.records(query), {
  staleTime: 60_000,
});

/** GET /admin/audience/records/{id}. */
export const audienceRecordQuery = createQueryStore((id: string) => audienceService.record(id), { keyOf: (id) => id });

export const useAudienceSummary = () => audienceSummaryQuery.useQuery();
export const useAudienceStates = () => audienceStatesQuery.useQuery();
export const useAudienceLgas = (state: string) => audienceLgasQuery.useQuery(state);
export const useAllAudienceLgas = () => allAudienceLgasQuery.useQuery();
export const useAudienceRecords = (query: AudienceRecordsQuery) => audienceRecordsQuery.useQuery(query);
export const useAudienceRecord = (id: string) => audienceRecordQuery.useQuery(id);

/** Uploads and deletes change every count, so all audience data is refetched on next view. */
const invalidateAudience = () => {
  audienceSummaryQuery.invalidate();
  audienceStatesQuery.invalidate();
  audienceLgasQuery.invalidate();
  allAudienceLgasQuery.invalidate();
  audienceRecordsQuery.invalidate();
};

/** Uploads .csv / .xlsx files; resolves to each file's outcome. Rejects with the API's `ApiError`. */
export const uploadAudienceFiles = async (files: File[]) => {
  const result = await audienceService.upload(files);
  invalidateAudience();
  return result;
};

/** Deletes the stored contacts of one state or LGA. Rejects with the API's `ApiError`. */
export const deleteAudienceRecords = async (query: DeleteAudienceRecordsQuery) => {
  const result = await audienceService.deleteRecords(query);
  invalidateAudience();
  audienceRecordQuery.reset();
  return result;
};
