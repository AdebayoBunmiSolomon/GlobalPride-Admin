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

/** Includes `current` when it isn't one of the presets (the API accepts any value from 5 to 1440). */
export const sessionTimeoutOptionsWith = (current: number) =>
  sessionTimeoutOptions.some((option) => option.value === String(current))
    ? sessionTimeoutOptions
    : [...sessionTimeoutOptions, { label: `${current} minutes`, value: String(current) }].sort(
        (a, b) => Number(a.value) - Number(b.value),
      );

/** What the API accepts for the logo (sent as a data: URI). */
export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
/** The API takes "at most about 400 KB" as a data: URI, which is a third larger than the file. */
export const MAX_LOGO_BYTES = 290 * 1024;
