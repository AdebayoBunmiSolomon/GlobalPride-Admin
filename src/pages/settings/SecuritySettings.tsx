import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Info } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSwitch } from "@/components/Switch";
import { useSettings } from "@/hooks/useSettings";
import type { SecuritySettings as SecuritySettingsValues } from "@/types/settings";
import { sessionTimeoutOptions } from "./settingsOptions";
import { SettingsFooter, SettingsLayout } from "./SettingsLayout";

export const SecuritySettings = () => {
  const { security, setSecurity } = useSettings();
  const [saved, setSaved] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<SecuritySettingsValues>({ defaultValues: security });

  // TODO: send to the settings API once it exists.
  const onSubmit = (values: SecuritySettingsValues) => {
    setSecurity(values);
    reset(values);
    setSaved(true);
  };

  return (
    <SettingsLayout
      title="Security Settings"
      description="Manage administrative access and session security."
      section="Security"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppCard divided title="Session Security" description="Controls how administrator sessions behave in the console.">
          <Controller
            control={control}
            name="sessionTimeout"
            render={({ field }) => (
              <WebAppSelectInput
                id="sessionTimeout"
                label="Admin Session Timeout"
                options={sessionTimeoutOptions}
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
                description="Requires administrators to use passwords that meet the platform's minimum security requirements (at least 8 characters with uppercase, lowercase and a number)."
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
    </SettingsLayout>
  );
};
