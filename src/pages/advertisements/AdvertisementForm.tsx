import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { RefreshCw, Send, Smartphone } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppTextarea } from "@/components/Textarea";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { fieldError } from "@/pages/pricing/fieldError";
import { advertisementSchema, type AdvertisementValues } from "@/schemas/advertisement";
import type { Advertisement } from "@/types/advertisement";
import { AdCreativeCard, AdvertisementNotFound } from "./AdvertisementParts";
import { backToAdvertisements, placementOptions } from "./advertisementOptions";
import { CreativeUpload } from "./CreativeUpload";

const emptyValues: Partial<AdvertisementValues> = {
  name: "",
  advertiser: "",
  description: "",
  creative: "",
  ctaLabel: "Learn More",
  destinationUrl: "",
  placement: "home_feed",
  startDate: "",
  startTime: "09:00",
  endDate: "",
  endTime: "23:59",
};

const toValues = (ad: Advertisement): AdvertisementValues => ({
  name: ad.name,
  advertiser: ad.advertiser,
  description: ad.description,
  creative: ad.creative,
  ctaLabel: ad.ctaLabel,
  destinationUrl: ad.destinationUrl,
  placement: ad.placement,
  startDate: ad.startAt.slice(0, 10),
  startTime: ad.startAt.slice(11, 16),
  endDate: ad.endAt.slice(0, 10),
  endTime: ad.endAt.slice(11, 16),
});

const placeholderBar = <span className="h-2 flex-1 rounded-full bg-gray-100" />;

/** Phone mock of the Home Feed with the ad slot between Quick Actions and Recent Campaigns. */
const HomeFeedPreview = ({ creative, advertiser, ctaLabel }: { creative?: string; advertiser?: string; ctaLabel?: string }) => (
  <aside className="rounded-xl border border-gray-200 bg-stone-50 p-4 lg:sticky lg:top-22">
    <p className="flex items-center gap-2 text-xs font-medium text-gray-700">
      <Smartphone className="h-4 w-4 text-gray-500" />
      Home Feed preview
    </p>
    <div className="mx-auto mt-3 max-w-64 rounded-[1.75rem] border-2 border-gray-200 bg-white p-3">
      <p className="text-[10px] font-medium text-gray-500">Quick Actions</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="aspect-square rounded-lg bg-gray-100" />
        ))}
      </div>
      <AdCreativeCard creative={creative} advertiser={advertiser} ctaLabel={ctaLabel} className="mt-3" />
      <p className="mt-3 text-[10px] font-medium text-gray-500">Recent Campaigns</p>
      {[0, 1].map((row) => (
        <div key={row} className="mt-2 flex items-center gap-2 rounded-lg border border-gray-100 p-2">
          <span className="h-6 w-6 rounded bg-gray-100" />
          {placeholderBar}
        </div>
      ))}
    </div>
    <p className="mt-3 text-center text-[11px] text-gray-500">
      Illustrative preview only — this ad is not live until it is eligible for display.
    </p>
  </aside>
);

const Section = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <WebAppCard title={title} description={description}>
    <div className="space-y-4">{children}</div>
  </WebAppCard>
);

/** Create / edit form. Omit `advertisement` to create a new one. */
const AdvertisementForm = ({ advertisement }: { advertisement?: Advertisement }) => {
  const navigate = useNavigate();
  const { createAdvertisement, updateAdvertisement } = useAdvertisements();
  const isEdit = Boolean(advertisement);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdvertisementValues>({
    resolver: yupResolver(advertisementSchema, { context: { requireFutureEnd: !isEdit } }),
    defaultValues: advertisement ? toValues(advertisement) : emptyValues,
  });

  const [creative, advertiser, ctaLabel] = useWatch({ control, name: ["creative", "advertiser", "ctaLabel"] });

  const cancelPath = advertisement ? `/advertisements/${advertisement.id}` : "/advertisements";

  // TODO: send to the API once the advertisements endpoint is available.
  const onSubmit = ({ startDate, startTime, endDate, endTime, ...values }: AdvertisementValues) => {
    const input = { ...values, startAt: `${startDate}T${startTime}`, endAt: `${endDate}T${endTime}` };
    if (advertisement) {
      updateAdvertisement(advertisement.id, input);
      navigate(`/advertisements/${advertisement.id}`);
    } else {
      navigate(`/advertisements/${createAdvertisement(input)}`);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <Section
          title="Advertisement Information"
          description="Internal details used by administrators to identify the advertisement."
        >
          <WebAppInput
            id="adName"
            label="Advertisement Name"
            required
            placeholder="e.g. October Business Promotion"
            autoFocus={!isEdit}
            error={fieldError(errors.name?.message)}
            {...register("name")}
          />
          <WebAppInput
            id="adAdvertiser"
            label="Advertiser / Business Name"
            required
            placeholder="e.g. Lagos Business Hub"
            helperText="Informational only — this does not create an advertiser account."
            error={fieldError(errors.advertiser?.message)}
            {...register("advertiser")}
          />
          <WebAppTextarea
            id="adDescription"
            label="Short Description"
            rows={3}
            placeholder="Optional internal note or short supporting description."
            helperText="For internal reference. This is not assumed to appear in the mobile app."
            error={fieldError(errors.description?.message)}
            className="bg-stone-50"
            {...register("description")}
          />
        </Section>

        <Section title="Advertisement Creative" description="The image shown in the Home Feed ad slot.">
          <div>
            <label htmlFor="adCreative" className="mb-1.5 block text-sm font-medium text-gray-700">
              Creative Image
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            </label>
            <Controller
              control={control}
              name="creative"
              render={({ field }) => (
                <CreativeUpload
                  id="adCreative"
                  value={field.value}
                  onChange={field.onChange}
                  onInvalid={(message) => setError("creative", { message })}
                  error={fieldError(errors.creative?.message)}
                />
              )}
            />
          </div>
        </Section>

        <Section title="Call to Action" description="Where the advertisement sends users when tapped.">
          <WebAppInput
            id="adCtaLabel"
            label="CTA Label"
            required
            placeholder="e.g. Learn More"
            error={fieldError(errors.ctaLabel?.message)}
            {...register("ctaLabel")}
          />
          <WebAppInput
            id="adDestinationUrl"
            type="url"
            inputMode="url"
            label="Destination URL"
            required
            placeholder="https://example.com/promo"
            helperText="Only HTTP and HTTPS destinations are supported."
            error={fieldError(errors.destinationUrl?.message)}
            {...register("destinationUrl")}
          />
        </Section>

        <Section title="Placement" description="Where the advertisement appears in the Global Pride app.">
          <Controller
            control={control}
            name="placement"
            render={({ field }) => (
              <WebAppSelectInput
                id="adPlacement"
                label="Advertisement Placement"
                required
                options={placementOptions}
                value={field.value}
                onChange={field.onChange}
                helperText="The Home Feed slot sits between Quick Actions and Recent Campaigns. Additional placements can be added later."
                error={fieldError(errors.placement?.message)}
                className="bg-stone-50"
              />
            )}
          />
        </Section>

        <Section
          title="Schedule"
          description="When the advertisement is eligible to display (application timezone)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <WebAppInput
              id="adStartDate"
              type="date"
              label="Start Date"
              required
              error={fieldError(errors.startDate?.message)}
              {...register("startDate")}
            />
            <WebAppInput
              id="adStartTime"
              type="time"
              label="Start Time"
              required
              error={fieldError(errors.startTime?.message)}
              {...register("startTime")}
            />
            <WebAppInput
              id="adEndDate"
              type="date"
              label="End Date"
              required
              error={fieldError(errors.endDate?.message)}
              {...register("endDate")}
            />
            <WebAppInput
              id="adEndTime"
              type="time"
              label="End Time"
              required
              error={fieldError(errors.endTime?.message)}
              {...register("endTime")}
            />
          </div>
          <p className="text-xs text-gray-500">
            The advertisement will not display before its start time and will stop after its end time. If the start is
            in the future it is saved as Scheduled and becomes Active when its start time arrives.
          </p>
        </Section>

        <div className="flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={() => navigate(cancelPath)}>
            Cancel
          </WebAppButton>
          <WebAppButton
            type="submit"
            loading={isSubmitting}
            leftIcon={isEdit ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          >
            {isEdit ? "Update Advertisement" : "Publish Advertisement"}
          </WebAppButton>
        </div>
      </div>

      <HomeFeedPreview creative={creative} advertiser={advertiser} ctaLabel={ctaLabel} />
    </form>
  );
};

export const CreateAdvertisement = () => (
  <div>
    <WebAppPageHeader
      title="Create Advertisement"
      description="Configure an advertisement for display in the Global Pride mobile app."
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Advertisement Management", to: "/advertisements" },
        { label: "Create Advertisement" },
      ]}
      backLink={backToAdvertisements}
    />
    <AdvertisementForm />
  </div>
);

const editBreadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Advertisement Management", to: "/advertisements" },
  { label: "Edit Advertisement" },
];

export const EditAdvertisement = () => {
  const { advertisementId } = useParams();
  const advertisement = useAdvertisements((state) => state.advertisements.find((ad) => ad.id === advertisementId));

  if (!advertisement) return <AdvertisementNotFound breadcrumbs={editBreadcrumbs} />;

  return (
    <div>
      <WebAppPageHeader
        title="Edit Advertisement"
        description={`Update the configuration for ${advertisement.name}.`}
        breadcrumbs={editBreadcrumbs}
        backLink={backToAdvertisements}
      />
      {/* Keyed so switching between ads starts a fresh form. */}
      <AdvertisementForm key={advertisement.id} advertisement={advertisement} />
    </div>
  );
};
