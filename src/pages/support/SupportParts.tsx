import { CircleHelp, Globe, Headset, Newspaper } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import { WebAppTabs } from "@/components/Tabs";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type {
  HelpContent,
  HelpContentKind,
  HelpContentStatus,
  TicketPriority,
  TicketStatus,
} from "@/types/support";
import { cn } from "@/utils/cn";
import { richTextClass, sanitizeRichText } from "@/utils/richText";
import {
  helpCategoryLabels,
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

interface HelpContentPreviewModalProps {
  kind: HelpContentKind;
  /** The content to preview; the modal is closed while this is undefined. */
  content?: Pick<HelpContent, "title" | "category" | "body">;
  onClose: () => void;
}

/** How an article or FAQ appears on the app's Help & Support screen. */
export const HelpContentPreviewModal = ({ kind, content, onClose }: HelpContentPreviewModalProps) => {
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
                  {helpCategoryLabels[content.category]}
                </span>
              )}
              {content.body ? (
                <div
                  className={cn("mt-4", richTextClass)}
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.body) }}
                />
              ) : (
                <p className="mt-4 text-sm text-gray-400">Nothing written yet.</p>
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
  content?: HelpContent;
  onClose: () => void;
  onConfirm: (content: HelpContent) => void;
}

export const DeleteHelpContentModal = ({ kind, content, onClose, onConfirm }: DeleteHelpContentModalProps) => (
  <WebAppModal open={Boolean(content)} onClose={onClose} title={helpContentKinds[kind].deleteTitle}>
    {content && (
      <>
        <p className="text-sm text-gray-600">{helpContentKinds[kind].deleteText}</p>
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={onClose}>
            Cancel
          </WebAppButton>
          <WebAppButton variant="danger" onClick={() => onConfirm(content)}>
            Delete
          </WebAppButton>
        </div>
      </>
    )}
  </WebAppModal>
);
