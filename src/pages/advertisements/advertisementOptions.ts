import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { Advertisement, AdvertisementPlacement, AdvertisementStatus } from "@/types/advertisement";

export const backToAdvertisements = { label: "Back to Advertisement Management", to: "/advertisements" };

export const advertisementStatusStyles: Record<AdvertisementStatus, BadgeStyle> = {
  active: { label: "Active", variant: "success", className: "text-green-700" },
  scheduled: { label: "Scheduled", variant: "primary" },
  paused: { label: "Paused", variant: "warning", className: "text-amber-700" },
  ended: { label: "Ended", variant: "neutral" },
};

/** List order: live ads first, ended last. */
export const statusRank: Record<AdvertisementStatus, number> = { active: 0, scheduled: 1, paused: 2, ended: 3 };

export const placementLabels: Record<AdvertisementPlacement, string> = {
  home_feed: "Home Feed",
};

export const placementOptions = Object.entries(placementLabels).map(([value, label]) => ({ label, value }));

export const advertisementStatusFilterOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(advertisementStatusStyles).map(([value, { label }]) => ({ label, value })),
];

export const placementFilterOptions = [{ label: "All Placements", value: "all" }, ...placementOptions];

/** Which lifecycle actions an ad in this status offers. Edit is always available. */
export const getAdvertisementActions = (status: AdvertisementStatus) => ({
  canPause: status === "active",
  canResume: status === "paused",
  canEnd: status !== "ended",
});

/** Click-through rate as "4.7%", or "—" when there are no impressions. */
export const formatCtr = ({ impressions, clicks }: Pick<Advertisement, "impressions" | "clicks">) =>
  impressions ? `${(((clicks ?? 0) / impressions) * 100).toFixed(1)}%` : "—";

const rangeDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" });

/** "Sep 15 – Oct 20, 2026"; the year is repeated only when the range spans two years. */
export const formatSchedule = (startAt: string, endAt: string) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${rangeDay.format(start)}${sameYear ? "" : `, ${start.getFullYear()}`} – ${rangeDay.format(end)}, ${end.getFullYear()}`;
};

export const ACCEPTED_CREATIVE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_CREATIVE_BYTES = 5 * 1024 * 1024;
