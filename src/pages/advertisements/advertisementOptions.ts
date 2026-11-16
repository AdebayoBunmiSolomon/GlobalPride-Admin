import type { AdminAdvertisement, AdvertisementStatus } from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import { parseApiDate } from "@/utils/format";

export const backToAdvertisements = { label: "Back to Advertisement Management", to: "/advertisements" };

export const advertisementStatusStyles: Record<AdvertisementStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "primary" },
  paused: { label: "Paused", variant: "warning", className: "text-amber-700" },
  ended: { label: "Ended", variant: "neutral" },
};

/** List order: live ads first, ended last. */
export const statusRank: Record<AdvertisementStatus, number> = { active: 0, scheduled: 1, paused: 2, ended: 3 };

/** Placements the API accepts. Only the Home Feed slot exists for now. */
export const placementLabels: Record<string, string> = {
  home_feed: "Home Feed",
};

/** "home_feed" → "Home Feed"; unknown placements are title-cased. */
export const placementLabel = (placement: string) =>
  placementLabels[placement] ?? placement.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const placementOptions = Object.entries(placementLabels).map(([value, label]) => ({ label, value }));

export const advertisementStatusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(advertisementStatusStyles).map(([value, { label }]) => ({ label, value })),
];

export const placementFilterOptions = [{ label: "All Placements", value: "all" }, ...placementOptions];

/** Which actions an ad in this status offers. An ended ad can't be edited or resumed. */
export const getAdvertisementActions = (status: AdvertisementStatus) => ({
  canEdit: status !== "ended",
  canPause: status === "active" || status === "scheduled",
  canResume: status === "paused",
  canEnd: status !== "ended",
});

/** Click-through rate as "4.7%", or "—" when there are no impressions. */
export const formatCtr = ({ impressions, clicks }: Pick<AdminAdvertisement, "impressions" | "clicks">) =>
  impressions ? `${(((clicks ?? 0) / impressions) * 100).toFixed(1)}%` : "—";

const rangeDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" });

/** "Sep 15 – Oct 20, 2026"; the year is repeated only when the range spans two years. */
export const formatSchedule = (startAt: string, endAt: string) => {
  if (!startAt || !endAt) return "—";
  const start = parseApiDate(startAt);
  const end = parseApiDate(endAt);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${rangeDay.format(start)}${sameYear ? "" : `, ${start.getFullYear()}`} – ${rangeDay.format(end)}, ${end.getFullYear()}`;
};

/** Local "YYYY-MM-DD" of an API timestamp (for date filters and the edit form). */
export const toLocalDate = (value: string) => {
  const date = parseApiDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Local "HH:mm" of an API timestamp. */
export const toLocalTime = (value: string) => {
  const date = parseApiDate(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const ACCEPTED_CREATIVE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_CREATIVE_BYTES = 5 * 1024 * 1024;
