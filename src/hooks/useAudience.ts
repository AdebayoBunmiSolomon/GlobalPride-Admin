import { create } from "zustand";

import { mockAudienceLgas, mockAudienceRecords, mockAudienceStates } from "@/data/mock";
import type {
  AudienceLga,
  AudienceRecord,
  AudienceState,
  AudienceStateSummary,
  LocationStatus,
  NewAudienceRecord,
} from "@/types/audience";

/** Today as a local "YYYY-MM-DD". */
const today = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// In-memory audience state so status changes and uploads show on every
// marketplace page. Replace with service calls once the audience API exists.
type AudienceStore = {
  states: AudienceState[];
  lgas: AudienceLga[];
  records: AudienceRecord[];
  setStateStatus: (id: string, status: LocationStatus) => void;
  setLgaStatus: (id: string, status: LocationStatus) => void;
  /** Adds records and bumps the record counts of their LGAs. */
  addRecords: (records: NewAudienceRecord[]) => void;
};

export const useAudience = create<AudienceStore>()((set) => ({
  states: mockAudienceStates,
  lgas: mockAudienceLgas,
  records: mockAudienceRecords,
  setStateStatus: (id, status) =>
    set((store) => ({
      states: store.states.map((state) =>
        state.id === id ? { ...state, status, lastUpdated: today() } : state,
      ),
    })),
  setLgaStatus: (id, status) =>
    set((store) => ({
      lgas: store.lgas.map((lga) => (lga.id === id ? { ...lga, status, lastUpdated: today() } : lga)),
    })),
  addRecords: (newRecords) =>
    set((store) => {
      const date = today();
      const addedPerLga = new Map<string, number>();
      newRecords.forEach((record) =>
        addedPerLga.set(record.lgaId, (addedPerLga.get(record.lgaId) ?? 0) + 1),
      );
      const touchedStates = new Set(newRecords.map((record) => record.stateId));
      const stamp = Date.now();

      return {
        records: [
          ...newRecords.map((record, index) => ({ ...record, id: `AUD-${stamp}-${index}` })),
          ...store.records,
        ],
        lgas: store.lgas.map((lga) => {
          const added = addedPerLga.get(lga.id);
          return added
            ? {
                ...lga,
                totalRecords: lga.totalRecords + added,
                availableRecords: lga.availableRecords + added,
                lastUpdated: date,
              }
            : lga;
        }),
        states: store.states.map((state) =>
          touchedStates.has(state.id) ? { ...state, lastUpdated: date } : state,
        ),
      };
    }),
}));

/** States with record counts summed from their LGAs. */
export const summarizeStates = (states: AudienceState[], lgas: AudienceLga[]): AudienceStateSummary[] => {
  const totals = new Map<string, { total: number; available: number }>();
  lgas.forEach((lga) => {
    const current = totals.get(lga.stateId) ?? { total: 0, available: 0 };
    current.total += lga.totalRecords;
    current.available += lga.availableRecords;
    totals.set(lga.stateId, current);
  });

  return states.map((state) => ({
    ...state,
    totalRecords: totals.get(state.id)?.total ?? 0,
    availableRecords: totals.get(state.id)?.available ?? 0,
  }));
};

/** A record is only available for targeting while both its state and LGA are active. */
export const getRecordStatus = (
  record: AudienceRecord,
  states: AudienceState[],
  lgas: AudienceLga[],
): LocationStatus => {
  const state = states.find((item) => item.id === record.stateId);
  const lga = lgas.find((item) => item.id === record.lgaId);
  return state?.status === "active" && lga?.status === "active" ? "active" : "inactive";
};
