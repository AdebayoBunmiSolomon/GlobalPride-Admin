const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** 42500 → "₦42,500". With `signed`, credits get a leading "+". */
export const formatNaira = (amount: number, { signed = false } = {}) => {
  const formatted = nairaFormatter.format(Math.abs(amount));
  if (amount < 0) return `-${formatted}`;
  return signed && amount > 0 ? `+${formatted}` : formatted;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** "Sep 12, 2026" */
export const formatDate = (value: string | Date) => dateFormatter.format(new Date(value));

/** "Sep 16, 2026 · 2:14 PM" */
export const formatDateTime = (value: string | Date) => {
  const date = new Date(value);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
};

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "2 hours ago", "yesterday", "3 days ago". */
export const formatRelativeTime = (value: string | Date, now = Date.now()) => {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);

  for (const [unit, size] of relativeUnits) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }

  return "just now";
};

const priceFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const fixedPriceFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Unit prices keep kobo: 4 → "₦4", 4.5 → "₦4.5". With `fixed`, 4 → "₦4.00". */
export const formatPrice = (amount: number, { fixed = false } = {}) =>
  (fixed ? fixedPriceFormatter : priceFormatter).format(amount);

/** Date-only "2026-09-01" → "Sep 1, 2026", read as local time so it never shifts a day. */
export const formatDateOnly = (value: string) => dateFormatter.format(new Date(`${value}T00:00:00`));

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** "September 25, 2026, 11:20 AM" */
export const formatLongDateTime = (value: string | Date) => {
  const date = new Date(value);
  return `${longDateFormatter.format(date)}, ${timeFormatter.format(date)}`;
};

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 });

/** ₦42,800,000 → "₦42.8M", ₦1,380,000 → "₦1.38M", ₦710,000 → "₦710K". */
export const formatCompactNaira = (amount: number) => `₦${compactFormatter.format(amount)}`;

/** "Sep 15, 2026, 9:00 AM" */
export const formatDateTimeShort = (value: string | Date) => {
  const date = new Date(value);
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
};
