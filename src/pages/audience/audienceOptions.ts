import type { AudienceGender } from "@/api/types/response";

export const genderLabels: Record<AudienceGender, string> = { male: "Male", female: "Female", unknown: "Unknown" };

/** Link to one state's LGAs; state names can contain spaces ("Akwa Ibom"). */
export const stateLgasPath = (state: string) => `/audience-marketplace/states/${encodeURIComponent(state)}/lgas`;
