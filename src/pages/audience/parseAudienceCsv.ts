import { getLgaId } from "@/data/mock";
import type { AudienceLga, AudienceState, Gender, NewAudienceRecord } from "@/types/audience";

export const audienceCsvTemplate =
  "Phone Number,First Name,Last Name,State,LGA,Gender\n08012345678,Ada,Okafor,Lagos,Ikeja,Female\n";

const requiredColumns = ["phonenumber", "firstname", "lastname", "state", "lga", "gender"] as const;
type Column = (typeof requiredColumns)[number];

const columnAliases: Record<string, Column> = { phone: "phonenumber" };

const columnLabels: Record<Column, string> = {
  phonenumber: "Phone Number",
  firstname: "First Name",
  lastname: "Last Name",
  state: "State",
  lga: "LGA",
  gender: "Gender",
};

/** Splits CSV text into rows of cells, honouring double-quoted cells. */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim()));
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** "+2348012345678" / "2348012345678" / "8012345678" → "08012345678"; `null` if invalid. */
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("234") ? `0${digits.slice(3)}` : digits.length === 10 ? `0${digits}` : digits;
  return /^0[789][01]\d{8}$/.test(local) ? local : null;
};

export type AudienceCsvResult =
  | { ok: false; error: string }
  | { ok: true; records: NewAudienceRecord[]; skipped: number };

export const parseAudienceCsv = (
  text: string,
  { states, lgas, existingPhones }: { states: AudienceState[]; lgas: AudienceLga[]; existingPhones: Set<string> },
): AudienceCsvResult => {
  const [header, ...rows] = parseCsv(text);
  if (!header) return { ok: false, error: "The file is empty." };

  const columns = header.map((name) => {
    const key = normalize(name);
    return columnAliases[key] ?? key;
  });
  const missing = requiredColumns.filter((column) => !columns.includes(column));
  if (missing.length > 0) {
    return { ok: false, error: `Missing columns: ${missing.map((column) => columnLabels[column]).join(", ")}. Download the template for the expected format.` };
  }
  if (rows.length === 0) return { ok: false, error: "The file has no audience rows." };

  const stateByName = new Map(states.map((state) => [normalize(state.name), state]));
  const lgaIds = new Set(lgas.map((lga) => lga.id));
  const seenPhones = new Set(existingPhones);
  const records: NewAudienceRecord[] = [];

  rows.forEach((cells) => {
    const value = (column: Column) => cells[columns.indexOf(column)]?.trim() ?? "";

    const phone = normalizePhone(value("phonenumber"));
    const state = stateByName.get(normalize(value("state")));
    const lgaId = state ? getLgaId(state.id, value("lga")) : "";
    const gender = value("gender").toLowerCase() as Gender;
    const firstName = value("firstname");
    const lastName = value("lastname");

    if (
      !phone ||
      seenPhones.has(phone) ||
      !state ||
      !lgaIds.has(lgaId) ||
      (gender !== "male" && gender !== "female") ||
      !firstName ||
      !lastName
    ) {
      return;
    }

    seenPhones.add(phone);
    records.push({ phone, firstName, lastName, stateId: state.id, lgaId, gender });
  });

  return { ok: true, records, skipped: rows.length - records.length };
};
