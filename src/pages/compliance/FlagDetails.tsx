import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Info, Lock, Megaphone, NotebookPen, ShieldCheck, User } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockCampaigns } from "@/data/mock";
import { useCompliance } from "@/hooks/useCompliance";
import { NoteComposer } from "@/pages/shared/NoteComposer";
import { RelatedLink } from "@/pages/shared/RelatedRecordLink";
import type { ComplianceFlag } from "@/types/compliance";
import { formatDate, formatDateTimeShort } from "@/utils/format";
import { FlagSeverityBadge, FlagStatusBadge } from "./ComplianceParts";
import { flagSources, flagStatusStyles } from "./complianceOptions";
import { FlagReviewPanel } from "./FlagReviewPanel";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Compliance", to: "/compliance" },
  { label: "Flag Details" },
];

const backLink = { label: "Back to Flagged Activities", to: "/compliance" };

/** Label + icon for the "Why This Was Flagged" box. */
const flagVerdict = (flag: ComplianceFlag) => {
  if (flag.status === "resolved") return { label: "Confirmed violation", icon: Info };
  if (flag.status === "dismissed") return { label: "No violation found", icon: Check };
  return { label: "Potential violation", icon: Info };
};

export const FlagDetails = () => {
  const { flagId } = useParams();
  const navigate = useNavigate();
  const flag = useCompliance((state) => state.flags.find((item) => item.id === flagId));
  const addNote = useCompliance((state) => state.addNote);

  if (!flag) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Flag not found"
            description="This compliance flag doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Flagged Activities", onClick: () => navigate("/compliance") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const campaign = flag.campaignId ? mockCampaigns.find((item) => item.id === flag.campaignId) : undefined;
  const verdict = flagVerdict(flag);
  const isOpen = flag.status === "pending_review" || flag.status === "under_review";
  const sourceLabel = flagSources[flag.source].label;

  return (
    <div className="space-y-4">
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <div className="-mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{flag.id}</span>
            <FlagStatusBadge status={flag.status} />
            <FlagSeverityBadge severity={flag.severity} />
          </div>
          <h1 className="mt-1 text-3xl leading-tight font-bold text-gray-900">{flag.activity}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Flagged {formatDate(flag.createdAt)} · Source: {sourceLabel}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <WebAppCard title="Flagged Content" description="The content that triggered this flag, where available.">
            {flag.content ? (
              <div className="rounded-lg border border-gray-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">{flag.content.label}</p>
                <p className="mt-1 text-sm text-gray-900">“{flag.content.text}”</p>
              </div>
            ) : (
              <p className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-gray-600">
                No content was captured for this flag.
              </p>
            )}
            {flag.campaignId && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">Related Campaign</p>
                <RelatedLink
                  icon={Megaphone}
                  label="Campaign"
                  title={campaign?.name ?? flag.campaignId}
                  subtitle={campaign ? `${campaign.id} · ${campaign.type} Campaign` : undefined}
                  to={`/campaigns/${flag.campaignId}`}
                />
              </div>
            )}
          </WebAppCard>

          <WebAppCard title="Why This Was Flagged">
            <div className="flex gap-3 rounded-lg border border-gray-200 bg-stone-50 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                <verdict.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-gray-500">{verdict.label}</p>
                <p className="mt-0.5 text-sm text-gray-900">{flag.reason}</p>
              </div>
            </div>
            {isOpen && (
              <p className="mt-3 text-xs text-gray-500">
                This is flagged as a potential issue only. A violation is not confirmed until an administrator completes
                the review.
              </p>
            )}
          </WebAppCard>

          <WebAppCard>
            <p className="mb-3 flex flex-wrap items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <span className="text-base font-semibold text-gray-900">Review Notes</span>
              <span className="text-xs text-gray-500">Internal · never visible to the user</span>
            </p>
            {flag.notes.length === 0 ? (
              <p className="mb-3 text-sm text-gray-600">No review notes yet.</p>
            ) : (
              <ul className="mb-3 space-y-3">
                {flag.notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
                    <p className="text-sm whitespace-pre-wrap text-gray-900">{note.body}</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {note.authorName} · {formatDateTimeShort(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {/* TODO: call the compliance API once the notes endpoint exists. */}
            <NoteComposer
              id="flagNote"
              label="Review note"
              placeholder="Add review note…"
              submitLabel="Add Note"
              submitIcon={NotebookPen}
              variant="outline"
              onSubmit={(body) => addNote(flag.id, body)}
            />
          </WebAppCard>
        </div>

        <div className="space-y-4">
          {/* Keyed so an unfinished decision doesn't carry over to another flag. */}
          <FlagReviewPanel key={flag.id} flag={flag} />

          <WebAppCard title="Flag Information">
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={[
                { label: "Flag ID", value: flag.id },
                {
                  label: "User",
                  value: (
                    <Link to={`/users/${flag.userId}`} className="text-primary hover:underline">
                      {flag.userName}
                    </Link>
                  ),
                },
                { label: "Source", value: sourceLabel },
                { label: "Reason", value: <span className="break-normal">{flag.reason}</span> },
                { label: "Severity", value: <FlagSeverityBadge severity={flag.severity} /> },
                { label: "Status", value: flagStatusStyles[flag.status].label },
                { label: "Created", value: formatDate(flag.createdAt) },
                { label: "Last Updated", value: formatDateTimeShort(flag.updatedAt) },
              ]}
            />
          </WebAppCard>

          <WebAppCard title="Related Information" description="Open the related record to investigate further.">
            <div className="space-y-3">
              <RelatedLink icon={User} label="User" title={flag.userName} subtitle={flag.userId} to={`/users/${flag.userId}`} />
              {flag.campaignId && (
                <RelatedLink
                  icon={Megaphone}
                  label="Campaign"
                  title={flag.campaignId}
                  subtitle={campaign?.name}
                  to={`/campaigns/${flag.campaignId}`}
                />
              )}
            </div>
          </WebAppCard>
        </div>
      </div>
    </div>
  );
};
