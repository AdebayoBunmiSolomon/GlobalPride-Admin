import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, CircleX, Pencil } from "lucide-react";

import type { AdminAnnouncement } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppPageHeader } from "@/components/PageHeader";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { ItemLoadState } from "@/pages/support/SupportParts";
import { cancelAnnouncement, useAnnouncement } from "@/store/announcementsStore";
import { appToast } from "@/utils/appToast";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { CancelNotificationModal, NotificationCard, NotificationStatusBadge } from "./NotificationParts";
import { announcementStatusStyles, backToNotifications } from "./notificationOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Notifications", to: "/notifications" },
  { label: "Notification Details" },
];

const when = (value: string | null) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

/** Footer line on the in-app preview. */
const cardMeta = ({ status, sentAt, scheduledAt }: AdminAnnouncement) => {
  if (status === "sent") return when(sentAt ?? scheduledAt);
  if (status === "sending") return "Sending now";
  return status === "scheduled" ? `Scheduled · ${when(scheduledAt)}` : `Cancelled · was scheduled for ${when(scheduledAt)}`;
};

const ReadTile = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-gray-200 bg-stone-50/60 px-4 py-3">
    <p className="text-xs text-gray-600">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
  </div>
);

export const NotificationDetails = () => {
  const { notificationId = "" } = useParams();
  const navigate = useNavigate();
  const { data: announcement, error, loading, refresh } = useAnnouncement(notificationId);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!announcement) {
    return (
      <ItemLoadState
        breadcrumbs={breadcrumbs}
        backLink={backToNotifications}
        icon={<Bell className="h-6 w-6" />}
        noun="Notification"
        error={error}
        loading={loading}
        onRetry={refresh}
      />
    );
  }

  const { status } = announcement;
  const isScheduled = status === "scheduled";

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { message } = await cancelAnnouncement(announcement);
      appToast.show("Announcement cancelled", message || "It won't be sent, and stays in the history.", "success");
      setConfirmCancel(false);
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: "We couldn't cancel this announcement." });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <WebAppPageHeader
          breadcrumbs={breadcrumbs}
          backLink={backToNotifications}
          actions={<RefreshButton label="Refresh notification" loading={loading} onClick={() => void refresh()} />}
        />
        <div className="-mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{announcement.code}</span>
            <NotificationStatusBadge status={status} />
          </div>
          <h1 className="mt-2 text-3xl leading-tight font-bold text-gray-900">{announcement.title}</h1>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <WebAppCard title="Notification Content" description="This is how the announcement appears to users in the app.">
          <div className="mx-auto max-w-md rounded-xl bg-stone-50 p-3">
            <NotificationCard title={announcement.title} message={announcement.message} meta={cardMeta(announcement)} />
          </div>
        </WebAppCard>

        <div className="space-y-4">
          <WebAppCard title="Notification Information">
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={[
                { label: "Code", value: announcement.code },
                { label: "Type", value: "Announcement" },
                { label: "Status", value: announcementStatusStyles[status].label },
                { label: "Created", value: when(announcement.createdAt) },
                ...(announcement.createdBy ? [{ label: "Created by", value: announcement.createdBy }] : []),
                status === "sent"
                  ? { label: "Sent", value: when(announcement.sentAt) }
                  : { label: "Scheduled for", value: when(announcement.scheduledAt) },
                { label: "Recipient scope", value: "All Users" },
                ...(announcement.recipients !== null
                  ? [{ label: "Recipients", value: announcement.recipients.toLocaleString() }]
                  : []),
              ]}
            />
          </WebAppCard>

          {announcement.recipients !== null && announcement.readCount !== null && (
            <WebAppCard title="Read Status" description="Recipient read state for this announcement.">
              <div className="grid grid-cols-2 gap-3">
                <ReadTile label="Read" value={announcement.readCount} />
                <ReadTile label="Unread" value={Math.max(0, announcement.recipients - announcement.readCount)} />
              </div>
            </WebAppCard>
          )}

          <WebAppCard title="Available Actions">
            {isScheduled ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/notifications/${encodeURIComponent(announcement.code)}/edit`)}
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
                  ? "This announcement has been sent. Sent announcements are kept for history and can't be edited."
                  : status === "sending"
                    ? "This announcement is being sent now and can no longer be edited or cancelled."
                    : "This announcement was cancelled before it was sent. It's kept in the history and can't be edited."}
              </p>
            )}
          </WebAppCard>
        </div>
      </div>

      <CancelNotificationModal
        open={confirmCancel}
        busy={cancelling}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
};
