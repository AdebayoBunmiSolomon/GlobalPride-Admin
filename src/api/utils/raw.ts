/*
 * Readers for API bodies Swagger doesn't document. Each field is taken from
 * the first of a few likely names, so a page keeps working whichever name the
 * backend uses. Replace with plain types once the bodies are documented.
 */
export type Raw = Record<string, unknown>;

export const isRaw = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The first of `names` that is set on `raw`. */
export const pick = (raw: Raw, ...names: string[]) => names.map((name) => raw[name]).find((value) => value != null);

/** A string field (numbers are stringified); null when missing, empty or an object. */
export const text = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  return value == null || value === "" || typeof value === "object" ? null : String(value);
};

/** A numeric field; null when missing or not a number. */
export const num = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  const number = Number(value);
  return value == null || value === "" || typeof value === "boolean" || !Number.isFinite(number) ? null : number;
};

/** A boolean field (also accepts "true" / "false" and 1 / 0); null when missing. */
export const bool = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return null;
};

/** A nested object field, or `{}`. */
export const nested = (raw: Raw, ...names: string[]): Raw => {
  const value = pick(raw, ...names);
  return isRaw(value) ? value : {};
};

/** An array-of-objects field, or `[]`. */
export const list = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  return Array.isArray(value) ? value.filter(isRaw) : [];
};

/** Comparable form of an enum name: "In_Progress" / "InProgress" → "inprogress". */
export const key = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** The known value matching `value` (compared with `key`), or `fallback`. */
export const oneOf = <T extends string>(values: readonly T[], value: unknown, fallback: T): T =>
  values.find((candidate) => key(candidate) === key(value)) ?? fallback;

/** A detail response may come flat or wrapped, e.g. `{ ticket: {...} }`; returns the merged object. */
export const unwrapItem = (result: unknown, ...wrappers: string[]): Raw | null => {
  if (!isRaw(result)) return null;
  const inner = wrappers.map((name) => result[name]).find(isRaw);
  return inner ? { ...result, ...inner } : result;
};
