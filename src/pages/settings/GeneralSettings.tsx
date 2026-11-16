import { useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Image, Trash2, Upload } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppInput } from "@/components/Input";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppTextarea } from "@/components/Textarea";
import { handleApiError } from "@/api/utils";
import { saveGeneralSettings, useAdminSettings } from "@/store/settingsStore";
import type { GeneralSettings as GeneralSettingsData } from "@/types/settings";
import { appToast } from "@/utils/appToast";
import { fieldError } from "@/pages/pricing/fieldError";
import {
  generalSettingsSchema,
  PLATFORM_DESCRIPTION_MAX,
  PLATFORM_NAME_MAX,
  type GeneralSettingsValues,
} from "@/schemas/settings";
import { ACCEPTED_LOGO_TYPES, MAX_LOGO_BYTES, timeZoneOptions } from "./settingsOptions";
import { SettingsFooter, SettingsLayout, SettingsLoadState } from "./SettingsLayout";

/** Field label with a "12/80" character count on the right. */
const CountedLabel = ({ children, length, max }: { children: ReactNode; length: number; max: number }) => (
  <span className="flex items-center justify-between gap-2">
    <span>{children}</span>
    <span className={length > max ? "text-xs font-normal text-red-500" : "text-xs font-normal text-gray-500"}>
      {length}/{max}
    </span>
  </span>
);

interface LogoPickerProps {
  value: string;
  onChange: (value: string) => void;
  onInvalid: (message: string) => void;
  error?: ReactNode;
}

const LogoPicker = ({ value, onChange, onInvalid, error }: LogoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // The API stores the logo as a data: URI.
  const readFile = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      onInvalid("Please upload a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      onInvalid("The logo must be 290 KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => onInvalid("We couldn't read that file. Please try another image.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-stone-50 text-gray-400">
          {value ? <img src={value} alt="Platform logo" className="h-full w-full object-contain p-1" /> : <Image className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-900">Current Logo</p>
          <p className="text-xs text-gray-500">{value ? "Custom logo uploaded." : "Not configured."}</p>
          <div className="mt-2 flex gap-2">
            <WebAppButton
              variant="outline"
              size="sm"
              leftIcon={<Upload className="h-3.5 w-3.5" />}
              onClick={() => inputRef.current?.click()}
            >
              {value ? "Replace" : "Upload"}
            </WebAppButton>
            <WebAppButton
              variant="outline"
              size="sm"
              disabled={!value}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => onChange("")}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Remove
            </WebAppButton>
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        aria-label="Upload logo"
        className="sr-only"
        onChange={(event) => {
          readFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <p className="mt-3 text-xs text-gray-500">
        {value
          ? "This logo is shown in the Admin Console sidebar. PNG, JPG or WebP, up to 290 KB."
          : "The Global Pride visual identity is applied by default."}
      </p>
    </div>
  );
};

const GeneralSettingsForm = ({ general }: { general: GeneralSettingsData }) => {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralSettingsValues>({
    resolver: yupResolver(generalSettingsSchema),
    defaultValues: general,
  });

  const [platformName, description] = useWatch({ control, name: ["platformName", "description"] });

  const onSubmit = async (values: GeneralSettingsValues) => {
    try {
      const { settings, message } = await saveGeneralSettings(values);
      reset(settings.general);
      setSaved(true);
      if (message) appToast.show("Settings saved", message, "success");
    } catch (error) {
      handleApiError(error, { fallbackMessage: "We couldn't save the general settings." });
    }
  };

  return (
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppCard divided title="Platform Information" description="Basic details about the Global Pride platform.">
          <div className="space-y-4">
            <WebAppInput
              id="platformName"
              label={
                <CountedLabel length={platformName?.length ?? 0} max={PLATFORM_NAME_MAX}>
                  Platform Name
                </CountedLabel>
              }
              maxLength={PLATFORM_NAME_MAX}
              error={fieldError(errors.platformName?.message)}
              {...register("platformName")}
            />
            <WebAppTextarea
              id="platformDescription"
              label={
                <CountedLabel length={description?.length ?? 0} max={PLATFORM_DESCRIPTION_MAX}>
                  Platform Description
                </CountedLabel>
              }
              rows={3}
              maxLength={PLATFORM_DESCRIPTION_MAX}
              placeholder="e.g. A short description of the Global Pride platform."
              helperText="A short summary shown across the platform."
              error={fieldError(errors.description?.message)}
              className="bg-stone-50"
              {...register("description")}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <WebAppInput
                id="supportEmail"
                type="email"
                label="Support Email"
                placeholder="e.g. support@example.com"
                helperText="Used for support correspondence. Leave blank if not configured."
                error={fieldError(errors.supportEmail?.message)}
                {...register("supportEmail")}
              />
              <WebAppInput
                id="supportPhone"
                type="tel"
                label="Support Phone"
                placeholder="e.g. +234 000 000 0000"
                helperText="Shown to users if configured."
                error={fieldError(errors.supportPhone?.message)}
                {...register("supportPhone")}
              />
            </div>
          </div>
        </WebAppCard>

        <WebAppCard divided title="Platform Branding" description="Manage the platform logo used across the Admin Console.">
          <Controller
            control={control}
            name="logo"
            render={({ field }) => (
              <LogoPicker
                value={field.value}
                onChange={field.onChange}
                onInvalid={(message) => setError("logo", { message })}
                error={fieldError(errors.logo?.message)}
              />
            )}
          />
        </WebAppCard>

        <WebAppCard divided title="Platform Preferences" description="Global settings applied across the platform.">
          <Controller
            control={control}
            name="timeZone"
            render={({ field }) => (
              <WebAppSelectInput
                id="timeZone"
                label="Default Time Zone"
                options={timeZoneOptions}
                value={field.value}
                onChange={field.onChange}
                searchable
                searchPlaceholder="Search time zones…"
                helperText="The platform's default time zone. Admin Console dates currently follow your device's time zone."
                error={fieldError(errors.timeZone?.message)}
                className="bg-stone-50"
              />
            )}
          />
        </WebAppCard>

        <SettingsFooter
          dirty={isDirty}
          saved={saved}
          submitting={isSubmitting}
          onCancel={() => {
            reset(general);
            setSaved(false);
          }}
        />
      </form>
  );
};

export const GeneralSettings = () => {
  const { data, error, refresh } = useAdminSettings();
  return (
    <SettingsLayout title="General Settings" description="Manage basic information and global platform preferences.">
      {data ? (
        <GeneralSettingsForm key={JSON.stringify(data.general)} general={data.general} />
      ) : (
        <SettingsLoadState error={error} onRetry={() => void refresh()} />
      )}
    </SettingsLayout>
  );
};
