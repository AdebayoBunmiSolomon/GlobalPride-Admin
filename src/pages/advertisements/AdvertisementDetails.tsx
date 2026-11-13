import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CirclePause, CirclePlay, CircleStop, ExternalLink, Info, Pencil } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { formatDateOnly, formatDateTimeShort } from "@/utils/format";
import {
  AdCreativeCard,
  AdvertisementNotFound,
  AdvertisementStatusBadge,
  EndAdvertisementModal,
} from "./AdvertisementParts";
import {
  advertisementStatusStyles,
  backToAdvertisements,
  formatCtr,
  getAdvertisementActions,
  placementLabels,
} from "./advertisementOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Advertisement Management", to: "/advertisements" },
  { label: "Advertisement Details" },
];

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-gray-200 bg-stone-50/60 px-4 py-4">
    <p className="text-xs font-medium text-gray-600">{label}</p>
    <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export const AdvertisementDetails = () => {
  const { advertisementId } = useParams();
  const navigate = useNavigate();
  const advertisement = useAdvertisements((state) => state.advertisements.find((ad) => ad.id === advertisementId));
  const { pauseAdvertisement, resumeAdvertisement, endAdvertisement } = useAdvertisements();
  const [confirmEnd, setConfirmEnd] = useState(false);

  if (!advertisement) return <AdvertisementNotFound breadcrumbs={breadcrumbs} />;

  const { canPause, canResume, canEnd } = getAdvertisementActions(advertisement.status);
  const placement = placementLabels[advertisement.placement];
  const hasTracking = advertisement.impressions !== undefined;
  const editPath = `/advertisements/${advertisement.id}/edit`;

  // TODO: call the advertisements API once the pause / resume / end endpoints exist.
  const handleEnd = () => {
    endAdvertisement(advertisement.id);
    setConfirmEnd(false);
  };

  return (
    <div className="space-y-4">
      <WebAppPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {advertisement.name}
            <AdvertisementStatusBadge status={advertisement.status} />
          </span>
        }
        description={`${advertisement.id} · ${advertisement.advertiser}`}
        breadcrumbs={breadcrumbs}
        backLink={backToAdvertisements}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Advertisement Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Advertisement ID", value: advertisement.id },
              { label: "Advertisement Name", value: advertisement.name },
              { label: "Advertiser / Business", value: advertisement.advertiser },
              { label: "Placement", value: placement },
              { label: "Status", value: advertisementStatusStyles[advertisement.status].label },
              { label: "Created Date", value: formatDateOnly(advertisement.createdAt) },
              { label: "Start Date and Time", value: formatDateTimeShort(advertisement.startAt) },
              { label: "End Date and Time", value: formatDateTimeShort(advertisement.endAt) },
              {
                label: "Destination URL",
                value: (
                  <a
                    href={advertisement.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-medium text-primary hover:underline"
                  >
                    <span>{advertisement.destinationUrl}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  </a>
                ),
              },
            ]}
          />
        </WebAppCard>

        <WebAppCard
          title="Creative Preview"
          action={
            <Link
              to={editPath}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          }
        >
          <AdCreativeCard
            creative={advertisement.creative}
            advertiser={advertisement.advertiser}
            ctaLabel={advertisement.ctaLabel}
            className="mx-auto max-w-xs"
          />
          <p className="mt-3 text-center text-xs text-gray-500">
            How the advertisement appears in the {placement} placement.
          </p>
        </WebAppCard>
      </div>

      <WebAppCard
        title="Performance Summary"
        action={<p className="text-xs text-gray-500">Lifetime metrics since this advertisement started serving</p>}
      >
        {hasTracking ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Impressions" value={(advertisement.impressions ?? 0).toLocaleString()} />
            <Metric label="Clicks" value={(advertisement.clicks ?? 0).toLocaleString()} />
            <Metric label="Click-Through Rate" value={formatCtr(advertisement)} />
          </div>
        ) : (
          <WebAppNote icon={<Info />}>
            Tracking data unavailable. Performance metrics will appear here when data becomes available.
          </WebAppNote>
        )}
        <p className="mt-3 text-xs text-gray-500">
          CTR is calculated as clicks ÷ impressions × 100 and is shown as “—” when there are no impressions.
        </p>
      </WebAppCard>

      <WebAppCard title="Available Actions">
        <div className="flex flex-wrap items-center gap-3">
          <WebAppButton variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => navigate(editPath)}>
            Edit
          </WebAppButton>
          {canPause && (
            <WebAppButton
              variant="outline"
              leftIcon={<CirclePause className="h-4 w-4" />}
              onClick={() => pauseAdvertisement(advertisement.id)}
            >
              Pause Advertisement
            </WebAppButton>
          )}
          {canResume && (
            <WebAppButton
              leftIcon={<CirclePlay className="h-4 w-4" />}
              onClick={() => resumeAdvertisement(advertisement.id)}
            >
              Resume Advertisement
            </WebAppButton>
          )}
          {canEnd ? (
            <WebAppButton
              variant="outline"
              leftIcon={<CircleStop className="h-4 w-4" />}
              onClick={() => setConfirmEnd(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-500"
            >
              End Advertisement
            </WebAppButton>
          ) : (
            <p className="text-sm text-gray-600">
              This advertisement has ended and cannot be resumed. It is retained for reference.
            </p>
          )}
        </div>
      </WebAppCard>

      <EndAdvertisementModal
        advertisement={confirmEnd ? advertisement : undefined}
        onClose={() => setConfirmEnd(false)}
        onConfirm={handleEnd}
      />
    </div>
  );
};
