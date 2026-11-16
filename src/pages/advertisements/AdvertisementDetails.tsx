import { Link, useNavigate, useParams } from "react-router-dom";
import { CirclePause, CirclePlay, CircleStop, ExternalLink, Info, Pencil, Trash2 } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useAdvertisement } from "@/store/advertisementsStore";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { AdCreativeCard, AdvertisementLoadState, AdvertisementStatusBadge } from "./AdvertisementParts";
import {
  advertisementStatusStyles,
  backToAdvertisements,
  formatCtr,
  getAdvertisementActions,
  placementLabel,
} from "./advertisementOptions";
import { useAdvertisementActions } from "./useAdvertisementActions";

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

const when = (value: string | null) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

export const AdvertisementDetails = () => {
  const { advertisementId = "" } = useParams();
  const navigate = useNavigate();
  const { data: advertisement, error, loading, refresh } = useAdvertisement(advertisementId);
  const { pause, resume, confirmEnd, confirmDelete, isBusy, working, modals } = useAdvertisementActions({
    onDeleted: () => navigate("/advertisements", { replace: true }),
  });

  if (!advertisement) {
    return <AdvertisementLoadState breadcrumbs={breadcrumbs} error={error} loading={loading} onRetry={refresh} />;
  }

  const { canEdit, canPause, canResume, canEnd } = getAdvertisementActions(advertisement.status);
  const placement = placementLabel(advertisement.placement);
  const hasTracking = advertisement.impressions !== null;
  const editPath = `/advertisements/${encodeURIComponent(advertisement.code)}/edit`;

  return (
    <div className="space-y-4">
      <WebAppPageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {advertisement.name}
            <AdvertisementStatusBadge status={advertisement.status} />
          </span>
        }
        description={[advertisement.code, advertisement.advertiser].filter(Boolean).join(" · ")}
        breadcrumbs={breadcrumbs}
        backLink={backToAdvertisements}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Advertisement Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Advertisement Code", value: advertisement.code },
              { label: "Advertisement Name", value: advertisement.name },
              { label: "Advertiser / Business", value: advertisement.advertiser || "—" },
              ...(advertisement.description ? [{ label: "Description", value: advertisement.description }] : []),
              { label: "Placement", value: placement },
              { label: "Status", value: advertisementStatusStyles[advertisement.status].label },
              { label: "Created Date", value: when(advertisement.createdAt) },
              { label: "Start Date and Time", value: when(advertisement.startAt) },
              { label: "End Date and Time", value: when(advertisement.endAt) },
              {
                label: "Destination URL",
                value: advertisement.destinationUrl ? (
                  <a
                    href={advertisement.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-medium text-primary hover:underline"
                  >
                    <span>{advertisement.destinationUrl}</span>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        </WebAppCard>

        <WebAppCard
          title="Creative Preview"
          action={
            canEdit && (
              <Link
                to={editPath}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            )
          }
        >
          <AdCreativeCard
            creative={advertisement.creativeUrl}
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
          {canEdit && (
            <WebAppButton
              variant="outline"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => navigate(editPath)}
              disabled={working}
            >
              Edit
            </WebAppButton>
          )}
          {canPause && (
            <WebAppButton
              variant="outline"
              leftIcon={<CirclePause className="h-4 w-4" />}
              loading={isBusy("pause", advertisement)}
              disabled={working}
              onClick={() => pause(advertisement)}
            >
              Pause Advertisement
            </WebAppButton>
          )}
          {canResume && (
            <WebAppButton
              leftIcon={<CirclePlay className="h-4 w-4" />}
              loading={isBusy("resume", advertisement)}
              disabled={working}
              onClick={() => resume(advertisement)}
            >
              Resume Advertisement
            </WebAppButton>
          )}
          {canEnd && (
            <WebAppButton
              variant="outline"
              leftIcon={<CircleStop className="h-4 w-4" />}
              disabled={working}
              onClick={() => confirmEnd(advertisement)}
              className="border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-500"
            >
              End Advertisement
            </WebAppButton>
          )}
          <WebAppButton
            variant="outline"
            leftIcon={<Trash2 className="h-4 w-4" />}
            disabled={working}
            onClick={() => confirmDelete(advertisement)}
            className="border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-500"
          >
            Delete
          </WebAppButton>
        </div>
        {!canEnd && (
          <p className="mt-3 text-sm text-gray-600">
            This advertisement has ended and can't be resumed or edited. Create a new advertisement instead.
          </p>
        )}
      </WebAppCard>

      {modals}
    </div>
  );
};
