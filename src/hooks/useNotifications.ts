import { create } from "zustand";

import { mockNotifications, notificationAudienceSize } from "@/data/mock";
import type { PlatformNotification } from "@/types/notification";

/** What an admin writes on the create / edit form. Admin notifications are always "All Users" announcements. */
export interface AnnouncementInput {
  title: string;
  message: string;
  /** Local date-time "YYYY-MM-DDTHH:mm" to schedule it; omit to send now. */
  scheduledFor?: string;
}

const nextId = (notifications: PlatformNotification[]) => {
  const highest = Math.max(0, ...notifications.map((item) => Number(item.id.replace("NOT-", "")) || 0));
  return `NOT-${String(highest + 1).padStart(6, "0")}`;
};

/** Status / timing fields for an announcement that is sent now or scheduled. */
const delivery = ({ scheduledFor }: AnnouncementInput, now: string): Partial<PlatformNotification> =>
  scheduledFor
    ? { status: "scheduled", scheduledFor, sentAt: undefined }
    : { status: "sent", scheduledFor: undefined, sentAt: now, recipients: notificationAudienceSize, readCount: 0 };

// In-memory notifications so creating, editing and cancelling show on every
// notification page. Replace with service calls once the notifications API exists.
type NotificationsState = {
  notifications: PlatformNotification[];
  /** Returns the new notification's ID. */
  createAnnouncement: (input: AnnouncementInput) => string;
  /** Scheduled announcements only. */
  updateAnnouncement: (id: string, input: AnnouncementInput) => void;
  cancelNotification: (id: string) => void;
};

export const useNotifications = create<NotificationsState>()((set, get) => ({
  notifications: mockNotifications,
  createAnnouncement: (input) => {
    const id = nextId(get().notifications);
    const now = new Date().toISOString();
    const notification: PlatformNotification = {
      id,
      title: input.title,
      message: input.message,
      source: "admin",
      type: "announcement",
      status: "scheduled",
      recipient: { scope: "all" },
      createdAt: now,
      ...delivery(input, now),
    };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    return id;
  },
  updateAnnouncement: (id, input) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id && item.status === "scheduled"
          ? { ...item, title: input.title, message: input.message, ...delivery(input, new Date().toISOString()) }
          : item,
      ),
    })),
  cancelNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id && item.status === "scheduled" ? { ...item, status: "cancelled" } : item,
      ),
    })),
}));
