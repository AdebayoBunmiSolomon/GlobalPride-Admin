import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Bell, CalendarClock, Globe, Info, Lock, Send, Smartphone, Users } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppTextarea } from "@/components/Textarea";
import { useNotifications } from "@/hooks/useNotifications";
import { useSettings } from "@/hooks/useSettings";
import { fieldError } from "@/pages/pricing/fieldError";
import {
  announcementSchema,
  NOTIFICATION_MESSAGE_MAX,
  NOTIFICATION_TITLE_MAX,
  type AnnouncementValues,
  type DeliveryMode,
} from "@/schemas/notification";
import type { PlatformNotification } from "@/types/notification";
import { cn } from "@/utils/cn";
import { NotificationCard } from "./NotificationParts";
import { backToNotifications } from "./notificationOptions";

const Counter = ({ length, max }: { length: number; max: number }) => (
  <p className={cn("mt-1 text-right text-xs", length > max ? "text-red-500" : "text-gray-500")}>
    {length}/{max}
  </p>
);

const deliveryOptions: { value: DeliveryMode; label: string }[] = [
  { value: "now", label: "Send Now" },
  { value: "later", label: "Schedule for Later" },
];

const DeliveryToggle = ({ value, onChange }: { value: DeliveryMode; onChange: (value: DeliveryMode) => void }) => (
  <div role="radiogroup" aria-label="Delivery" className="inline-flex gap-1 rounded-lg border border-gray-200 bg-stone-50 p-1">
    {deliveryOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          "rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
          value === option.value ? "bg-primary text-white shadow-sm" : "text-gray-700 hover:bg-white",
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/** The app's Profile → Notifications screen with the draft at the top. */
const NotificationPreview = ({ title, message }: { title?: string; message?: string }) => (
  <aside className="rounded-xl border border-gray-200 bg-white p-4 lg:sticky lg:top-22">
    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
      <Smartphone className="h-4 w-4 text-gray-500" />
      Preview
    </p>
    <p className="mt-0.5 text-xs text-gray-500">How users see this in the app under Profile → Notifications.</p>
    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-stone-50">
      <div className="bg-primary px-4 py-3 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4" />
          Global Pride
        </p>
        <p className="text-xs text-white/80">Notifications</p>
      </div>
      <div className="p-3">
        <NotificationCard title={title} message={message} meta="Just now" clamp />
      </div>
    </div>
  </aside>
);

const Section = ({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) => (
  <WebAppCard title={title} description={description}>
    <div className="space-y-4">{children}</div>
  </WebAppCard>
);

/** Create / edit an admin announcement. Omit `notification` to create a new one. */
const NotificationForm = ({ notification }: { notification?: PlatformNotification }) => {
  const navigate = useNavigate();
  const { createAnnouncement, updateAnnouncement } = useNotifications();
  const isEdit = Boolean(notification);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementValues>({
    resolver: yupResolver(announcementSchema),
    defaultValues: notification
      ? {
          title: notification.title,
          message: notification.message,
          delivery: notification.scheduledFor ? "later" : "now",
          scheduleDate: notification.scheduledFor?.slice(0, 10) ?? "",
          scheduleTime: notification.scheduledFor?.slice(11, 16) ?? "",
        }
      : { title: "", message: "", delivery: "now", scheduleDate: "", scheduleTime: "09:00" },
  });

  const [title, message, delivery] = useWatch({ control, name: ["title", "message", "delivery"] });
  const isLater = delivery === "later";

  // TODO: send to the API once the notifications endpoint is available.
  const onSubmit = ({ title, message, delivery, scheduleDate, scheduleTime }: AnnouncementValues) => {
    const input = { title, message, scheduledFor: delivery === "later" ? `${scheduleDate}T${scheduleTime}` : undefined };
    if (notification) {
      updateAnnouncement(notification.id, input);
      navigate(`/notifications/${notification.id}`);
    } else {
      navigate(`/notifications/${createAnnouncement(input)}`);
    }
  };

  const submit = isLater
    ? { label: isEdit ? "Update Schedule" : "Schedule Notification", icon: CalendarClock }
    : { label: "Send Notification", icon: Send };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <Section
          title="Notification Details"
          description={
            <>
              This form is for admin announcements sent to users.
              {isEdit && (
                <span className="mt-2 flex w-fit items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  <Info className="h-3.5 w-3.5" />
                  You can edit this announcement until it is sent.
                </span>
              )}
            </>
          }
        >
          <div>
            <WebAppInput
              id="notificationTitle"
              label="Notification Title"
              required
              placeholder="e.g. Scheduled maintenance on October 12"
              maxLength={NOTIFICATION_TITLE_MAX}
              autoFocus={!isEdit}
              error={fieldError(errors.title?.message)}
              {...register("title")}
            />
            <Counter length={title?.length ?? 0} max={NOTIFICATION_TITLE_MAX} />
          </div>
          <WebAppInput
            id="notificationType"
            label="Type"
            value="Announcement"
            readOnly
            rightIcon={<Lock className="h-4 w-4 text-gray-400" />}
            helperText="Admin-created notifications are announcements. Operational notifications are generated automatically by the platform."
          />
        </Section>

        <Section title="Message" description="Keep it short and scannable — this is what users read in the app.">
          <div>
            <WebAppTextarea
              id="notificationMessage"
              label="Message"
              required
              rows={4}
              maxLength={NOTIFICATION_MESSAGE_MAX}
              placeholder="e.g. We will be performing scheduled maintenance on October 12 from 12:00 AM to 2:00 AM."
              error={fieldError(errors.message?.message)}
              className="bg-stone-50"
              {...register("message")}
            />
            <Counter length={message?.length ?? 0} max={NOTIFICATION_MESSAGE_MAX} />
          </div>
        </Section>

        <Section title="Recipient">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-stone-50 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">All Users</p>
              <p className="text-xs text-gray-500">Announcements are sent to every Global Pride user.</p>
            </div>
          </div>
        </Section>

        <Section title="Delivery">
          <Controller
            control={control}
            name="delivery"
            render={({ field }) => <DeliveryToggle value={field.value} onChange={field.onChange} />}
          />
          {isLater && (
            <div className="grid gap-4 sm:grid-cols-2">
              <WebAppInput
                id="notificationDate"
                type="date"
                label="Date"
                required
                error={fieldError(errors.scheduleDate?.message)}
                {...register("scheduleDate")}
              />
              <WebAppInput
                id="notificationTime"
                type="time"
                label="Time"
                required
                error={fieldError(errors.scheduleTime?.message)}
                {...register("scheduleTime")}
              />
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-3">
          <WebAppButton
            variant="outline"
            onClick={() => navigate(notification ? `/notifications/${notification.id}` : "/notifications")}
          >
            Cancel
          </WebAppButton>
          <WebAppButton type="submit" loading={isSubmitting} leftIcon={<submit.icon className="h-4 w-4" />}>
            {submit.label}
          </WebAppButton>
        </div>
      </div>

      <NotificationPreview title={title} message={message} />
    </form>
  );
};

export const CreateNotification = () => {
  const navigate = useNavigate();
  const announcementsAllowed = useSettings((state) => state.notifications.adminAnnouncements);

  return (
    <div>
      <WebAppPageHeader
        title="Create Notification"
        description="Send an announcement to Global Pride users."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Notifications", to: "/notifications" },
          { label: "Create Notification" },
        ]}
        backLink={backToNotifications}
      />
      {announcementsAllowed ? (
        <NotificationForm />
      ) : (
        <WebAppCard>
          <WebAppEmptyState
            icon={<Bell className="h-6 w-6" />}
            title="Admin announcements are turned off"
            description="Turn on “Allow Admin Announcements” in Settings → Notifications to send announcements to users."
            primaryAction={{ label: "Open Notification Settings", onClick: () => navigate("/settings/notifications") }}
            secondaryAction={{ label: "Back to Notifications", onClick: () => navigate("/notifications") }}
          />
        </WebAppCard>
      )}
    </div>
  );
};

const editBreadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Notifications", to: "/notifications" },
  { label: "Edit Notification" },
];

export const EditNotification = () => {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const notification = useNotifications((state) => state.notifications.find((item) => item.id === notificationId));

  // Only scheduled admin announcements can be edited.
  if (!notification || notification.status !== "scheduled") {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={editBreadcrumbs} backLink={backToNotifications} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<Bell className="h-6 w-6" />}
            title={notification ? "This notification can't be edited" : "Notification not found"}
            description={
              notification
                ? "Only scheduled announcements can be edited. Sent and cancelled notifications are kept for history."
                : "This notification doesn't exist, or the link is incorrect."
            }
            primaryAction={
              notification
                ? { label: "View Notification", onClick: () => navigate(`/notifications/${notification.id}`) }
                : { label: "Back to Notifications", onClick: () => navigate("/notifications") }
            }
          />
        </WebAppCard>
      </div>
    );
  }

  return (
    <div>
      <WebAppPageHeader
        title="Edit Notification"
        description="Update this scheduled announcement before it is sent."
        breadcrumbs={editBreadcrumbs}
        backLink={backToNotifications}
      />
      {/* Keyed so switching between notifications starts a fresh form. */}
      <NotificationForm key={notification.id} notification={notification} />
    </div>
  );
};
