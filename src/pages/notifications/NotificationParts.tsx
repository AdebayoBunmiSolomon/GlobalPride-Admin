import { Bell } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { AnnouncementStatus } from "@/api/types/response";
import { cn } from "@/utils/cn";
import { announcementStatusStyles } from "./notificationOptions";

const StyledBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);

export const NotificationStatusBadge = ({ status }: { status: AnnouncementStatus }) => (
  <StyledBadge style={announcementStatusStyles[status]} />
);

interface NotificationCardProps {
  title?: string;
  message?: string;
  /** Footer line, e.g. the sent time or "Just now". */
  meta: string;
  /** Clamp the message to two lines, as in the app's notification list. */
  clamp?: boolean;
  className?: string;
}

/** A single notification as it appears in the app's Notifications list. */
export const NotificationCard = ({ title, message, meta, clamp = false, className }: NotificationCardProps) => (
  <div className={cn("flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm", className)}>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Bell className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1">
      <p className={cn("text-sm font-semibold break-words", title?.trim() ? "text-gray-900" : "text-gray-400")}>
        {title?.trim() || "Notification title"}
      </p>
      <p
        className={cn(
          "mt-1 text-sm break-words whitespace-pre-line",
          message?.trim() ? "text-gray-700" : "text-gray-400",
          clamp && "line-clamp-2",
        )}
      >
        {message?.trim() || "Your notification message will appear here."}
      </p>
      <p className="mt-3 text-[11px] text-gray-500">{meta}</p>
    </div>
  </div>
);

interface CancelNotificationModalProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelNotificationModal = ({ open, busy, onClose, onConfirm }: CancelNotificationModalProps) => (
  <WebAppModal open={open} onClose={onClose} title="Cancel Scheduled Notification?">
    <p className="text-sm text-gray-600">
      This notification will not be sent and will remain in your notification history as cancelled.
    </p>
    <div className="mt-5 flex justify-end gap-3">
      <WebAppButton variant="outline" onClick={onClose} disabled={busy}>
        Keep Scheduled
      </WebAppButton>
      <WebAppButton variant="danger" loading={busy} onClick={onConfirm}>
        Cancel Notification
      </WebAppButton>
    </div>
  </WebAppModal>
);
