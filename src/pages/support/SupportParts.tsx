import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, CircleHelp, Globe, Headset, Newspaper } from "lucide-react";

import type {
  AdminHelpContent,
  ApiError,
  HelpContentKind,
  HelpContentStatus,
  TicketPriority,
  TicketStatus,
} from "@/api/types/response";
import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppTabs } from "@/components/Tabs";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import { cn } from "@/utils/cn";
export { RefreshButton } from "@/pages/shared/RefreshButton";
import { richTextClass, sanitizeRichText } from "@/utils/richText";
import {
  helpCategoryLabel,
  helpContentKinds,
  helpStatusStyles,
  ticketPriorityStyles,
  ticketStatusStyles,
} from "./supportOptions";

const StyledBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <StyledBadge style={ticketStatusStyles[status]} />
);

export const TicketPriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <StyledBadge style={ticketPriorityStyles[priority]} />
);

export const HelpStatusBadge = ({ status }: { status: HelpContentStatus }) => (
  <StyledBadge style={helpStatusStyles[status]} />
);

const tabs = [
  { label: "Support Tickets", to: "/support", icon: Headset, end: true },
  { label: "Help Articles", to: "/support/articles", icon: Newspaper, end: false },
  { label: "FAQs", to: "/support/faqs", icon: CircleHelp, end: false },
];

/** Switches between the three support sections. */
export const SupportTabs = () => <WebAppTabs label="Support sections" tabs={tabs} />;

/** A list's body while it loads or when it couldn't be loaded. Returns null once data is available. */
export const ListLoadState = ({
  error,
  hasData,
  what,
  onRetry,
}: {
  error: ApiError | null;
  hasData: boolean;
  /** e.g. "support tickets". */
  what: string;
  onRetry: () => void;
}) => {
  if (hasData) return null;
  if (error) {
    return (
      <WebAppEmptyState
        icon={<CircleAlert className="h-6 w-6" />}
        title={`Couldn't load ${what}`}
        description={error.message}
        primaryAction={{ label: "Try again", onClick: onRetry }}
      />
    );
  }
  return (
    <div className="space-y-3 p-5" aria-busy="true" aria-label={`Loading ${what}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
};

interface ItemLoadStateProps {
  breadcrumbs: { label: string; to?: string }[];
  backLink: { label: string; to: string };
  icon: ReactNode;
  /** e.g. "Ticket". */
  noun: string;
  error: ApiError | null;
  loading: boolean;
  onRetry: () => void;
}

/** Shown while a ticket / article / FAQ loads, or when it couldn't be loaded / doesn't exist. */
export const ItemLoadState = ({ breadcrumbs, backLink, icon, noun, error, loading, onRetry }: ItemLoadStateProps) => {
  const navigate = useNavigate();
  const notFound = error?.status === 404 || error?.status === 400;

  return (
    <div>
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
      {error ? (
        <WebAppCard>
          <WebAppEmptyState
            icon={notFound ? icon : <CircleAlert className="h-6 w-6" />}
            title={notFound ? `${noun} not found` : `Couldn't load this ${noun.toLowerCase()}`}
            description={notFound ? "It may have been deleted, or the link is incorrect." : error.message}
            primaryAction={
              notFound
                ? { label: backLink.label, onClick: () => navigate(backLink.to) }
                : { label: "Try again", onClick: onRetry }
            }
          />
        </WebAppCard>
      ) : (
        <div className="space-y-4" aria-busy={loading} aria-label={`Loading ${noun.toLowerCase()}`}>
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}
    </div>
  );
};

interface HelpContentPreviewModalProps {
  kind: HelpContentKind;
  /** The content to preview; the modal is closed while this is undefined. */
  content?: Pick<AdminHelpContent, "title" | "category" | "body">;
  /** The body is still loading. */
  loading?: boolean;
  /** The body couldn't be loaded. */
  error?: string | null;
  onClose: () => void;
}

/** How an article or FAQ appears on the app's Help & Support screen. */
export const HelpContentPreviewModal = ({ kind, content, loading, error, onClose }: HelpContentPreviewModalProps) => {
  const eyebrow = helpContentKinds[kind].previewEyebrow;

  return (
    <WebAppModal open={Boolean(content)} onClose={onClose} title="Preview" className="max-w-sm">
      {content && (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="bg-primary px-4 py-3 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" />
                Global Pride
              </p>
              <p className="text-xs text-white/80">Help &amp; Support</p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {eyebrow && <p className="text-[11px] font-medium text-gray-500">{eyebrow}</p>}
              <h3 className="text-base font-semibold text-gray-900">{content.title.trim() || "Untitled"}</h3>
              {content.category && (
                <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                  {helpCategoryLabel(content.category)}
                </span>
              )}
              {content.body ? (
                <div
                  className={cn("mt-4", richTextClass)}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.body) }}
                />
              ) : loading ? (
                <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading content">
                  <div className="h-3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-gray-100" />
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">{error ?? "Nothing written yet."}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <WebAppButton variant="outline" onClick={onClose}>
              Close Preview
            </WebAppButton>
          </div>
        </>
      )}
    </WebAppModal>
  );
};

interface DeleteHelpContentModalProps {
  kind: HelpContentKind;
  /** The item to delete; the modal is closed while this is undefined. */
  content?: AdminHelpContent;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (content: AdminHelpContent) => void;
}

export const DeleteHelpContentModal = ({ kind, content, busy, onClose, onConfirm }: DeleteHelpContentModalProps) => (
  <WebAppModal open={Boolean(content)} onClose={onClose} title={helpContentKinds[kind].deleteTitle}>
    {content && (
      <>
        <p className="text-sm text-gray-600">{helpContentKinds[kind].deleteText}</p>
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </WebAppButton>
          <WebAppButton variant="danger" loading={busy} onClick={() => onConfirm(content)}>
            Delete
          </WebAppButton>
        </div>
      </>
    )}
  </WebAppModal>
);
