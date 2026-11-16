import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  CirclePlus,
  CircleX,
  Info,
  RefreshCw,
  Send,
  type LucideIcon,
} from "lucide-react";

import type { AdminCampaignDetails } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { humanizeType } from "@/pages/shared/activityStyle";
import { useCampaignDetails, useCampaignRecipients } from "@/store/campaignsStore";
import { cn } from "@/utils/cn";
import { formatDateTime, formatDateTimeShort, formatPrice, parseApiDate } from "@/utils/format";
import { toneStyles, type Tone } from "@/utils/tones";
import { CampaignNotFound } from "./CampaignNotFound";
import { DeliveryReportCard } from "./DeliveryReportCard";
import { CampaignStatusBadge, RecipientStatusBadge } from "./StatusBadges";

const RECIPIENT_PREVIEW_COUNT = 5;

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Campaign Management", to: "/campaigns" },
  { label: "Campaign Details" },
];

const formatWhen = (value: string | null) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");
const formatMoney = (amount: number | null) => (amount == null ? "—" : formatPrice(amount, { fixed: true }));

interface TimelineEntry {
  text: string;
  at: string | null;
  icon: LucideIcon;
  tone: Tone;
}

/** The campaign's history, built from its timestamps (newest first). */
const buildTimeline = (campaign: AdminCampaignDetails): TimelineEntry[] => {
  const entries: TimelineEntry[] = [
    { text: `Created by ${campaign.userName}`, at: campaign.createdAt, icon: CirclePlus, tone: "purple" },
  ];
  if (campaign.scheduledAt) {
    entries.push({ text: `Scheduled to send ${formatWhen(campaign.scheduledAt)}`, at: campaign.scheduledAt, icon: CalendarClock, tone: "blue" });
  }
  if (campaign.sentAt) {
    entries.push({ text: `Sent to ${campaign.recipients.toLocaleString()} recipients`, at: campaign.sentAt, icon: Send, tone: "green" });
  }
  if (campaign.cancelledAt) {
    entries.push({
      text: campaign.cancellationReason ? `Cancelled: ${campaign.cancellationReason}` : "Cancelled",
      at: campaign.cancelledAt,
      icon: CircleX,
      tone: "gray",
    });
  }
  if (campaign.status === "failed") {
    // The API has no failure timestamp; show it last.
    entries.push({ text: campaign.failureReason ? `Failed: ${campaign.failureReason}` : "Failed", at: null, icon: CircleAlert, tone: "red" });
  }
  return entries.sort((a, b) => (b.at ?? "9999").localeCompare(a.at ?? "9999"));
};

const RecipientsPreview = ({ campaign }: { campaign: AdminCampaignDetails }) => {
  const { data, error, loading, refresh } = useCampaignRecipients(campaign.id);
  const preview = data?.items.slice(0, RECIPIENT_PREVIEW_COUNT) ?? [];

  return (
    <WebAppCard
      title="Recipients"
      description={
        data && data.items.length > 0
          ? `Showing ${preview.length} of ${data.items.length.toLocaleString()} addressed`
          : `${campaign.recipients.toLocaleString()} recipients`
      }
      action={
        data && data.items.length > 0 ? (
          <Link
            to={`/campaigns/${campaign.id}/recipients`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Recipients <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : undefined
      }
    >
      {!data ? (
        error ? (
          <div className="text-sm text-gray-600">
            <p>{error.message}</p>
            <button type="button" onClick={refresh} className="mt-2 font-medium text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="h-32 animate-pulse rounded-lg bg-gray-50" aria-busy={loading} aria-label="Loading recipients" />
        )
      ) : preview.length === 0 ? (
        <p className="flex gap-2 rounded-lg bg-stone-50 px-4 py-3 text-sm text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          {data.note || "This campaign has no recipient list."}
        </p>
      ) : (
        <ul className="-my-3 divide-y divide-gray-100">
          {preview.map((recipient) => (
            <li key={recipient.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{recipient.name || "Unnamed contact"}</p>
                <p className="text-xs text-gray-500">{recipient.phoneNumber || "—"}</p>
              </div>
              {recipient.deliveryStatus && <RecipientStatusBadge status={recipient.deliveryStatus} />}
            </li>
          ))}
        </ul>
      )}
    </WebAppCard>
  );
};

export const CampaignDetails = () => {
  const { campaignId = "" } = useParams();
  // Cached per campaign (see src/store).
  const { data: campaign, error, loading, refresh } = useCampaignDetails(campaignId);

  if (error?.status === 404) return <CampaignNotFound breadcrumbs={breadcrumbs} />;

  if (!campaign) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Campaigns", to: "/campaigns" }} />
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load this campaign"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          </WebAppCard>
        ) : (
          <div className="space-y-4" aria-busy={loading} aria-label="Loading campaign">
            <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const timeline = buildTimeline(campaign);
  const isImage = campaign.type.toLowerCase() === "image";

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Campaigns", to: "/campaigns" }} />

      <WebAppCard bodyClassName="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1.5 text-sm text-gray-600">
            {campaign.id} · {campaign.type} ·{" "}
            <Link to={`/users/${campaign.userId}`} className="font-medium text-gray-900 hover:underline">
              {campaign.userName}
            </Link>{" "}
            · Created {formatWhen(campaign.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh campaign"
          title="Refresh"
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </WebAppCard>


      {campaign.status === "failed" && campaign.failureReason && (
        <div role="alert" className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Campaign failed.</span> {campaign.failureReason}
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Campaign Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Campaign Name", value: campaign.name },
              { label: "Reference", value: campaign.id },
              { label: "Type", value: campaign.type },
              ...(isImage && campaign.imageDeliveryChannel
                ? [{ label: "Image Delivery", value: humanizeType(campaign.imageDeliveryChannel) }]
                : []),
              { label: "Category", value: campaign.category || "—" },
              { label: "Sender ID", value: campaign.sender || "—" },
              { label: "Recipient Source", value: campaign.recipientSource ? humanizeType(campaign.recipientSource) : "—" },
              { label: "Personalization", value: campaign.personalizationEnabled ? "On" : "Off" },
              { label: "Created", value: formatWhen(campaign.createdAt) },
              ...(campaign.scheduledAt ? [{ label: "Scheduled For", value: formatWhen(campaign.scheduledAt) }] : []),
              ...(campaign.sentAt ? [{ label: "Sent", value: formatWhen(campaign.sentAt) }] : []),
              ...(campaign.cancelledAt ? [{ label: "Cancelled", value: formatWhen(campaign.cancelledAt) }] : []),
            ]}
          />
        </WebAppCard>

        <DeliveryReportCard campaign={campaign} />

        <WebAppCard title="Message">
          <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm whitespace-pre-wrap text-gray-800">
            {campaign.message || <span className="text-gray-400">No message text.</span>}
          </p>
          {isImage && campaign.imageFileName && (
            <p className="mt-3 text-xs text-gray-500">Image: {campaign.imageFileName}</p>
          )}
          {campaign.audience && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-700">Audience Marketplace targeting</p>
              <WebAppDetailList
                align="right"
                className="mt-1"
                items={[
                  { label: "Coverage", value: campaign.audience.coverage ? humanizeType(campaign.audience.coverage) : "—" },
                  { label: "Gender", value: campaign.audience.gender || "—" },
                  { label: "States", value: campaign.audience.states.length ? campaign.audience.states.join(", ") : "All" },
                  ...(campaign.audience.localGovernments.length
                    ? [{ label: "LGAs", value: campaign.audience.localGovernments.join(", ") }]
                    : []),
                ]}
              />
            </div>
          )}
        </WebAppCard>

        <WebAppCard title="User & Cost">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              {
                label: "User",
                value: (
                  <Link to={`/users/${campaign.userId}`} className="font-medium text-primary hover:underline">
                    {campaign.userName}
                  </Link>
                ),
              },
              { label: "Email", value: campaign.userEmail || "—" },
              { label: "Phone", value: campaign.userPhone || "—" },
              { label: "Estimated Cost", value: formatMoney(campaign.estimatedCost) },
              { label: "Actual Cost", value: formatMoney(campaign.actualCost) },
            ]}
          />
        </WebAppCard>

        <RecipientsPreview campaign={campaign} />

        <WebAppCard title="Campaign Log">
          <ol className="-my-3 divide-y divide-gray-100">
            {timeline.map((entry) => (
              <li key={entry.text} className="flex items-center gap-3 py-3">
                <span className={cn("rounded-md p-2", toneStyles[entry.tone].icon)}>
                  <entry.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-gray-900">{entry.text}</p>
                  {entry.at && (
                    <time dateTime={parseApiDate(entry.at).toISOString()} className="text-xs text-gray-500">
                      {formatDateTime(parseApiDate(entry.at))}
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </WebAppCard>
      </div>
    </div>
  );
};
