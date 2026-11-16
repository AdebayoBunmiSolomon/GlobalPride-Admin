import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { WebAppCard } from "@/components/Card";
import { WebAppSwitch } from "@/components/Switch";
import { handleApiError } from "@/api/utils";
import { saveNotificationSettings, useAdminSettings } from "@/store/settingsStore";
import { appToast } from "@/utils/appToast";
import type { NotificationSettings as NotificationSettingsValues } from "@/types/settings";
import { SettingsFooter, SettingsLayout, SettingsLoadState } from "./SettingsLayout";

const systemToggles: { name: keyof NotificationSettingsValues; label: string; description: string }[] = [
  { name: "campaign", label: "Campaign Notifications", description: "Notify users when important campaign events occur." },
  { name: "wallet", label: "Wallet Notifications", description: "Notify users about wallet funding and wallet events." },
  { name: "referral", label: "Referral Notifications", description: "Notify users when referral bonuses are credited." },
  { name: "support", label: "Support Notifications", description: "Notify users when their support tickets receive a response." },
  { name: "account", label: "Account Notifications", description: "Notify users about relevant account and security events." },
];

const NotificationSettingsForm = ({ notifications }: { notifications: NotificationSettingsValues }) => {
  const [saved, setSaved] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<NotificationSettingsValues>({ defaultValues: notifications });

  const onSubmit = async (values: NotificationSettingsValues) => {
    try {
      const { settings, message } = await saveNotificationSettings(values);
      reset(settings.notifications);
      setSaved(true);
      if (message) appToast.show("Settings saved", message, "success");
    } catch (error) {
      handleApiError(error, { fallbackMessage: "We couldn't save the notification settings." });
    }
  };

  return (
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppCard
          divided
          title="System Notifications"
          description="Control which automatically generated notifications users receive."
        >
          <ul className="-my-3 divide-y divide-gray-100">
            {systemToggles.map((toggle) => (
              <li key={toggle.name} className="py-3.5">
                <Controller
                  control={control}
                  name={toggle.name}
                  render={({ field }) => (
                    <WebAppSwitch
                      label={toggle.label}
                      description={toggle.description}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </li>
            ))}
          </ul>
        </WebAppCard>

        <WebAppCard divided title="Admin Announcements" description="Control whether administrators can publish announcements.">
          <Controller
            control={control}
            name="adminAnnouncements"
            render={({ field }) => (
              <WebAppSwitch
                label="Allow Admin Announcements"
                description="Allows authorized administrators to send announcements to users through the Notifications module."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <p className="mt-4 text-xs text-gray-500">
            Notification records and history remain managed in the Notifications module. While this is off, new
            announcements can't be created and scheduled ones wait until it's turned back on.
          </p>
        </WebAppCard>

        <SettingsFooter
          dirty={isDirty}
          saved={saved}
          submitting={isSubmitting}
          onCancel={() => {
            reset(notifications);
            setSaved(false);
          }}
        />
      </form>
  );
};

export const NotificationSettings = () => {
  const { data, error, refresh } = useAdminSettings();
  return (
    <SettingsLayout
      title="Notification Settings"
      description="Manage how platform notifications are generated and delivered."
      section="Notifications"
    >
      {data ? (
        <NotificationSettingsForm key={JSON.stringify(data.notifications)} notifications={data.notifications} />
      ) : (
        <SettingsLoadState error={error} onRetry={() => void refresh()} />
      )}
    </SettingsLayout>
  );
};
