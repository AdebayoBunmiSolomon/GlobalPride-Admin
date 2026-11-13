import { create } from "zustand";

import { mockAdvertisements } from "@/data/mock";
import type { Advertisement, AdvertisementStatus } from "@/types/advertisement";

/** The fields an admin configures on the create / edit form. */
export type AdvertisementInput = Pick<
  Advertisement,
  "name" | "advertiser" | "description" | "creative" | "ctaLabel" | "destinationUrl" | "placement" | "startAt" | "endAt"
>;

/** Active once the start time has arrived, otherwise Scheduled. */
export const getScheduleStatus = (startAt: string): AdvertisementStatus =>
  new Date(startAt).getTime() > Date.now() ? "scheduled" : "active";

const toDateOnly = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// In-memory advertisements so create / edit / pause / resume / end show on
// every advertisement page. Replace with service calls once the ads API exists.
type AdvertisementsState = {
  advertisements: Advertisement[];
  /** Returns the new advertisement's ID. */
  createAdvertisement: (input: AdvertisementInput) => string;
  updateAdvertisement: (id: string, input: AdvertisementInput) => void;
  pauseAdvertisement: (id: string) => void;
  resumeAdvertisement: (id: string) => void;
  endAdvertisement: (id: string) => void;
};

const nextId = (advertisements: Advertisement[]) => {
  const highest = Math.max(1000, ...advertisements.map((ad) => Number(ad.id.replace("AD-", "")) || 0));
  return `AD-${highest + 1}`;
};

export const useAdvertisements = create<AdvertisementsState>()((set, get) => {
  const update = (id: string, change: (ad: Advertisement) => Partial<Advertisement>) =>
    set((state) => ({
      advertisements: state.advertisements.map((ad) => (ad.id === id ? { ...ad, ...change(ad) } : ad)),
    }));

  return {
    advertisements: mockAdvertisements,
    createAdvertisement: (input) => {
      const id = nextId(get().advertisements);
      set((state) => ({
        advertisements: [
          ...state.advertisements,
          { ...input, id, status: getScheduleStatus(input.startAt), createdAt: toDateOnly(new Date()) },
        ],
      }));
      return id;
    },
    // Paused and ended ads keep their status; otherwise a new start time can
    // move an ad between Scheduled and Active.
    updateAdvertisement: (id, input) =>
      update(id, (ad) => ({
        ...input,
        status: ad.status === "active" || ad.status === "scheduled" ? getScheduleStatus(input.startAt) : ad.status,
      })),
    pauseAdvertisement: (id) => update(id, () => ({ status: "paused" })),
    resumeAdvertisement: (id) => update(id, (ad) => ({ status: getScheduleStatus(ad.startAt) })),
    endAdvertisement: (id) => update(id, () => ({ status: "ended" })),
  };
});
