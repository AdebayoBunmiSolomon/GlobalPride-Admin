const FALLBACK_TIME_ZONES = ["Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London", "UTC"];

/** Every IANA time zone the browser knows, plus UTC (which some browsers leave out). */
export const timeZoneOptions = Array.from(
  new Set([...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : FALLBACK_TIME_ZONES), "UTC"]),
).map((zone) => ({ label: zone, value: zone }));

export const sessionTimeoutOptions = [
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
];

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
/** Kept small because settings (including the logo) are stored in localStorage. */
export const MAX_LOGO_BYTES = 1024 * 1024;
