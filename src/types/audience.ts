export type Gender = "male" | "female";

/** Whether a state / LGA's audience can be used for marketplace targeting. */
export type LocationStatus = "active" | "inactive";

export interface AudienceState {
  /** Slug, e.g. "akwa-ibom". */
  id: string;
  name: string;
  status: LocationStatus;
  /** Date only, "YYYY-MM-DD". */
  lastUpdated: string;
}

/** A state with its record counts rolled up from its LGAs. */
export interface AudienceStateSummary extends AudienceState {
  totalRecords: number;
  availableRecords: number;
}

export interface AudienceLga {
  /** `${stateId}-${slug}`, e.g. "abia-aba-north". */
  id: string;
  stateId: string;
  name: string;
  totalRecords: number;
  availableRecords: number;
  status: LocationStatus;
  /** Date only, "YYYY-MM-DD". */
  lastUpdated: string;
}

export interface AudienceRecord {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  stateId: string;
  lgaId: string;
  gender: Gender;
}

export type NewAudienceRecord = Omit<AudienceRecord, "id">;
