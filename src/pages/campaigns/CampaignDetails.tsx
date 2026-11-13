import { Link, useParams } from "react-router-dom";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppPageHeader } from "@/components/PageHeader";
import { getCampaignLog, getCampaignRecipients, mockCampaigns } from "@/data/mock";
import { useCompliance } from "@/hooks/useCompliance";
import { isOpenFlag } from "@/pages/compliance/complianceOptions";
import type { Campaign } from "@/types/campaign";
import type { ComplianceFlag } from "@/types/compliance";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import { toneStyles } from "@/utils/tones";
import { CampaignNotFound } from "./CampaignNotFound";
import { CampaignStatusBadge, RecipientStatusBadge } from "./StatusBadges";
import { campaignStatusStyles } from "./statusStyles";

const RECIPIENT_PREVIEW_COUNT = 6;

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Campaign Management", to: "/campaigns" },
  { label: "Campaign Details" },
];

/** Shown while the campaign has open compliance flags; links to the most recent one. */
const FlagBanner = ({ flags }: { flags: ComplianceFlag[] }) => (
  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
    <span className="h-fit rounded-md bg-amber-100 p-2 text-amber-700">
      <ShieldAlert className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-900">Flagged for compliance review</p>
      <p className="mt-0.5 text-sm text-gray-700">
        {flags[0].reason}
        {flags.length > 1 && ` (+${flags.length - 1} more)`}
      </p>
      <Link
        to={`/compliance/flags/${flags[0].id}`}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline"
      >
        Review Flag <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  </div>
);

const DeliverySummary = ({ campaign }: { campaign: Campaign }) => {
  const { delivery, recipients } = campaign;
  const totalRow = { label: "Total Recipients", value: recipients.toLocaleString() };

  if (!delivery) {
    return (
      <>
        <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-gray-600">
          {campaign.status === "cancelled"
            ? "This campaign was cancelled before delivery, so no delivery statistics are available."
            : "Delivery has not started yet. Statistics will appear once the campaign is sent."}
        </p>
        <WebAppDetailList align="right" className="mt-2" items={[totalRow]} />
      </>
    );
  }

  const percent = (count: number) => `${(count / recipients) * 100}%`;

  return (
    <>
      <div
        role="img"
        aria-label={`${delivery.delivered.toLocaleString()} delivered, ${delivery.failed.toLocaleString()} failed, ${delivery.pending.toLocaleString()} pending`}
        className="flex h-2 overflow-hidden rounded-full bg-gray-100"
      >
        <div className="bg-green-500" style={{ width: percent(delivery.delivered) }} />
        <div className="bg-red-500" style={{ width: percent(delivery.failed) }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-600" aria-hidden="true">
        {[
          ["Delivered", "bg-green-500"],
          ["Failed", "bg-red-500"],
          ["Pending", "bg-gray-300"],
        ].map(([label, dot]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", dot)} />
            {label}
          </span>
        ))}
      </div>

      <WebAppDetailList
        align="right"
        className="mt-2"
        items={[
          totalRow,
          { label: "Delivered", value: delivery.delivered.toLocaleString() },
          { label: "Failed", value: delivery.failed.toLocaleString() },
          ...(delivery.pending > 0
            ? [{ label: "Pending", value: delivery.pending.toLocaleString() }]
            : []),
          {
            label: "Delivery Rate",
            value: `${Math.round((delivery.delivered / recipients) * 100)}%`,
          },
        ]}
      />
    </>
  );
};

export const CampaignDetails = () => {
  const { campaignId } = useParams();
  const flags = useCompliance((state) => state.flags);
  // TODO: fetch the campaign, its recipient preview, log and flags from the API.
  const campaign = mockCampaigns.find((item) => item.id === campaignId);

  if (!campaign) return <CampaignNotFound breadcrumbs={breadcrumbs} />;

  const recipientPreview = getCampaignRecipients(campaign).slice(0, RECIPIENT_PREVIEW_COUNT);
  const log = getCampaignLog(campaign);
  const openFlags = flags
    .filter((flag) => flag.campaignId === campaign.id && isOpenFlag(flag))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <WebAppPageHeader
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to Campaigns", to: "/campaigns" }}
      />

      <WebAppCard>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <p className="mt-1.5 text-sm text-gray-600">
          {campaign.id} · {campaign.type} ·{" "}
          <Link
            to={`/users/${campaign.userId}`}
            className="font-medium text-gray-900 hover:underline"
          >
            {campaign.userName}
          </Link>{" "}
          · Created {formatDate(campaign.createdAt)}
        </p>
      </WebAppCard>

      {openFlags.length > 0 && <FlagBanner flags={openFlags} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Campaign Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Campaign Name", value: campaign.name },
              { label: "Campaign ID", value: campaign.id },
              { label: "Type", value: campaign.type },
              { label: "User", value: campaign.userName },
              { label: "Sender", value: campaign.sender },
              { label: "Status", value: campaignStatusStyles[campaign.status].label },
              { label: "Created", value: formatDate(campaign.createdAt) },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Delivery Summary">
          <DeliverySummary campaign={campaign} />
        </WebAppCard>

        <WebAppCard
          title="Recipients"
          description={`Showing ${recipientPreview.length} of ${campaign.recipients.toLocaleString()} recipients`}
          action={
            <Link
              to={`/campaigns/${campaign.id}/recipients`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All Recipients <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <ul className="-my-3 divide-y divide-gray-100">
            {recipientPreview.map((recipient) => (
              <li key={recipient.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{recipient.name}</p>
                  <p className="text-xs text-gray-500">{recipient.phone}</p>
                </div>
                <RecipientStatusBadge status={recipient.status} />
              </li>
            ))}
          </ul>
        </WebAppCard>

        <WebAppCard title="Campaign Log">
          <ol className="-my-3 divide-y divide-gray-100">
            {log.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-3">
                <span className={cn("rounded-md p-2", toneStyles[entry.tone].icon)}>
                  <entry.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-gray-900">{entry.text}</p>
                  <time dateTime={entry.at} className="text-xs text-gray-500">
                    {formatDateTime(entry.at)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </WebAppCard>
      </div>
    </div>
  );
};
