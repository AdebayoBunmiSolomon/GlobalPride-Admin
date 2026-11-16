import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Info } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSwitch } from "@/components/Switch";
import { handleApiError } from "@/api/utils";
import { saveSecuritySettings, useAdminSettings } from "@/store/settingsStore";
import { appToast } from "@/utils/appToast";
import type { SecuritySettings as SecuritySettingsValues } from "@/types/settings";
import { sessionTimeoutOptionsWith } from "./settingsOptions";
import { SettingsFooter, SettingsLayout, SettingsLoadState } from "./SettingsLayout";

const SecuritySettingsForm = ({ security }: { security: SecuritySettingsValues }) => {
  const [saved, setSaved] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<SecuritySettingsValues>({ defaultValues: security });

  const onSubmit = async (values: SecuritySettingsValues) => {
    try {
      const { settings, message } = await saveSecuritySettings(values);
      reset(settings.security);
      setSaved(true);
      if (message) appToast.show("Settings saved", message, "success");
    } catch (error) {
      handleApiError(error, { fallbackMessage: "We couldn't save the security settings." });
    }
  };

  return (
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppCard divided title="Session Security" description="Controls how administrator sessions behave in the console.">
          <Controller
            control={control}
            name="sessionTimeout"
            render={({ field }) => (
              <WebAppSelectInput
                id="sessionTimeout"
                label="Admin Session Timeout"
                options={sessionTimeoutOptionsWith(security.sessionTimeout)}
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                helperText="Administrators will be signed out after the selected period of inactivity."
                className="bg-stone-50"
              />
            )}
          />
        </WebAppCard>

        <WebAppCard divided title="Admin Login Security" description="Password requirements for administrator accounts.">
          <Controller
            control={control}
            name="requireStrongPasswords"
            render={({ field }) => (
              <WebAppSwitch
                label="Require Strong Passwords"
                description="Requires administrators to use passwords that meet the platform's minimum security requirements (upper case, number and special character)."
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </WebAppCard>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-4 py-3 text-xs text-gray-600">
          <Info className="h-4 w-4 shrink-0 text-gray-400" />
          These settings apply to the Admin Console only. Mobile user account security is managed separately.
        </div>

        <SettingsFooter
          dirty={isDirty}
          saved={saved}
          submitting={isSubmitting}
          onCancel={() => {
            reset(security);
            setSaved(false);
          }}
        />
      </form>
  );
};

export const SecuritySettings = () => {
  const { data, error, refresh } = useAdminSettings();
  return (
    <SettingsLayout
      title="Security Settings"
      description="Manage administrative access and session security."
      section="Security"
    >
      {data ? (
        <SecuritySettingsForm key={JSON.stringify(data.security)} security={data.security} />
      ) : (
        <SettingsLoadState error={error} onRetry={() => void refresh()} />
      )}
    </SettingsLayout>
  );
};
