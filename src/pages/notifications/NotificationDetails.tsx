import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bell, CircleX, Pencil } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useNotifications } from "@/hooks/useNotifications";
import { RelatedRecordLink } from "@/pages/shared/RelatedRecordLink";
import type { PlatformNotification } from "@/types/notification";
import { formatDate, formatDateTimeShort } from "@/utils/format";
import { CancelNotificationModal, NotificationCard, NotificationSourceBadge, NotificationStatusBadge } from "./NotificationParts";
import {
  backToNotifications,
  notificationSourceStyles,
  notificationStatusStyles,
  notificationTypes,
} from "./notificationOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Notifications", to: "/notifications" },
  { label: "Notification Details" },
];

/** Footer line on the in-app preview. */
const cardMeta = (notification: PlatformNotification) => {
  if (notification.status === "sent" && notification.sentAt) return formatDateTimeShort(notification.sentAt);
  const when = notification.scheduledFor ? formatDateTimeShort(notification.scheduledFor) : "";
  return notification.status === "scheduled" ? `Scheduled · ${when}` : `Cancelled · was scheduled for ${when}`;
};

const ReadTile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-gray-200 bg-stone-50/60 px-4 py-3">
    <p className="text-xs text-gray-600">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
  </div>
);

export const NotificationDetails = () => {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const notification = useNotifications((state) => state.notifications.find((item) => item.id === notificationId));
  const cancelNotification = useNotifications((state) => state.cancelNotification);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!notification) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backToNotifications} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Notification not found"
            description="This notification doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Notifications", onClick: () => navigate("/notifications") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const { recipient, status } = notification;
  const isScheduled = status === "scheduled";

  // TODO: call the notifications API once the cancel endpoint exists.
  const handleCancel = () => {
    cancelNotification(notification.id);
    setConfirmCancel(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backToNotifications} />
        <div className="-mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <NotificationSourceBadge source={notification.source} />
            <WebAppBadge>{notificationTypes[notification.type].label}</WebAppBadge>
            <NotificationStatusBadge status={status} />
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-bold text-gray-900">{notification.title}</h1>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <WebAppCard title="Notification Content" description="This is how the notification appears to users in the app.">
            <div className="mx-auto max-w-md rounded-xl bg-stone-50 p-3">
              <NotificationCard title={notification.title} message={notification.message} meta={cardMeta(notification)} />
            </div>
          </WebAppCard>

          {notification.related && (
            <WebAppCard title="Related Information" description="Open the related record to investigate further.">
              <RelatedRecordLink record={notification.related} />
            </WebAppCard>
          )}
        </div>

        <div className="space-y-4">
          <WebAppCard title="Notification Information">
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={[
                { label: "Notification ID", value: notification.id },
                { label: "Source", value: notificationSourceStyles[notification.source].label },
                { label: "Type", value: notificationTypes[notification.type].label },
                { label: "Status", value: notificationStatusStyles[status].label },
                { label: "Created", value: formatDate(notification.createdAt) },
                status === "sent"
                  ? { label: "Sent", value: notification.sentAt ? formatDateTimeShort(notification.sentAt) : "—" }
                  : {
                      label: "Scheduled for",
                      value: notification.scheduledFor ? formatDateTimeShort(notification.scheduledFor) : "—",
                    },
                {
                  label: "Recipient scope",
                  value:
                    recipient.scope === "all" ? (
                      "All Users"
                    ) : (
                      <Link to={`/users/${recipient.userId}`} className="text-primary hover:underline">
                        {recipient.userName}
                      </Link>
                    ),
                },
                ...(notification.recipients !== undefined
                  ? [{ label: "Recipients", value: notification.recipients.toLocaleString() }]
                  : []),
              ]}
            />
          </WebAppCard>

          {notification.recipients !== undefined && notification.readCount !== undefined && (
            <WebAppCard title="Read Status" description="Recipient read state for this notification.">
              <div className="grid grid-cols-2 gap-3">
                <ReadTile label="Read" value={notification.readCount} />
                <ReadTile label="Unread" value={Math.max(0, notification.recipients - notification.readCount)} />
              </div>
            </WebAppCard>
          )}

          <WebAppCard title="Available Actions">
            {isScheduled ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/notifications/${notification.id}/edit`)}
                  className="flex h-11 w-full items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="flex h-11 w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <CircleX className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {status === "sent"
                  ? "This notification has been sent. Sent notifications are kept for administrative history and cannot be edited."
                  : "This notification was cancelled before it was sent. It is kept in your notification history and cannot be edited."}
              </p>
            )}
          </WebAppCard>
        </div>
      </div>

      <CancelNotificationModal open={confirmCancel} onClose={() => setConfirmCancel(false)} onConfirm={handleCancel} />
    </div>
  );
};
