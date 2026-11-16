import { useState, type ComponentType } from "react";
import { ArrowRight, Check, CircleAlert, CircleCheck, CircleStop, Eye, ShieldCheck, UserMinus, UserX } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppModal } from "@/components/Modal";
import { WebAppTextarea } from "@/components/Textarea";
import type { ComplianceFlag, FlagAction } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { confirmFlagViolation, dismissFlag, startFlagReview } from "@/store/complianceStore";
import { appToast } from "@/utils/appToast";
import { cn } from "@/utils/cn";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { flagActionLabels } from "./complianceOptions";

type Decision = "violation" | "no_violation";

interface OptionCardProps {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const OptionCard = ({ icon: Icon, iconClassName, title, description, selected, onSelect }: OptionCardProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={cn(
      "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
      selected ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:bg-gray-50",
    )}
  >
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", iconClassName)}>
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-gray-900">{title}</span>
      <span className="block text-xs text-gray-600">{description}</span>
    </span>
    {selected && <CircleCheck className="h-5 w-5 shrink-0 fill-primary text-white" />}
  </button>
);

const actionOptions: Record<FlagAction, Omit<OptionCardProps, "selected" | "onSelect" | "title">> = {
  campaign_cancelled: {
    icon: CircleStop,
    iconClassName: "bg-red-50 text-red-600",
    description: "Cancel the campaign and stop further delivery.",
  },
  user_suspended: {
    icon: UserX,
    iconClassName: "bg-amber-50 text-amber-700",
    description: "Suspend the user's Global Pride account.",
  },
  user_restricted: {
    icon: UserMinus,
    iconClassName: "bg-amber-50 text-amber-700",
    description: "Restrict the user's platform activity.",
  },
  no_further_action: {
    icon: Check,
    iconClassName: "bg-gray-100 text-gray-600",
    description: "Record the violation without further enforcement.",
  },
};

const confirmCopy: Record<FlagAction, { title: string; text: string }> = {
  campaign_cancelled: {
    title: "Confirm Campaign Cancellation?",
    text: "This will cancel the affected campaign and prevent further delivery.",
  },
  user_suspended: {
    title: "Confirm User Suspension?",
    text: "This will suspend the user's Global Pride account and prevent further platform activity.",
  },
  user_restricted: {
    title: "Confirm User Restriction?",
    text: "This will restrict the user's platform activity pending further review.",
  },
  no_further_action: {
    title: "Confirm Violation?",
    text: "The violation will be recorded without further enforcement.",
  },
};

const SectionLabel = ({ children }: { children: string }) => (
  <p className="mb-2 text-sm font-semibold text-gray-900">{children}</p>
);

/** The "Compliance Review" card: start a review, record a decision, or show the outcome. */
export const FlagReviewPanel = ({ flag }: { flag: ComplianceFlag }) => {
  const { name: adminName } = useCurrentAdmin();
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<Decision>();
  const [action, setAction] = useState<FlagAction>();
  const [dismissReason, setDismissReason] = useState("");
  const [dismissError, setDismissError] = useState("");
  const [confirming, setConfirming] = useState(false);

  /** Runs a review action with a spinner and toasts; resolves to whether it succeeded. */
  const run = async (action: () => Promise<{ message: string | null }>, done: string, fallbackMessage: string) => {
    setBusy(true);
    try {
      const { message } = await action();
      appToast.show("Saved", message || done, "success");
      return true;
    } catch (caught) {
      handleApiError(caught, { fallbackMessage });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (flag.status === "pending_review") {
    return (
      <WebAppCard title="Compliance Review">
        <p className="text-sm text-gray-600">
          This flag is pending review. Open the review to investigate the flagged activity and record a decision.
        </p>
        <WebAppButton
          className="mt-4"
          loading={busy}
          leftIcon={<Eye className="h-4 w-4" />}
          onClick={() =>
            void run(() => startFlagReview(flag), "The flag is now under review.", "We couldn't start the review.")
          }
        >
          Start Review
        </WebAppButton>
      </WebAppCard>
    );
  }

  if (flag.status === "resolved" || flag.status === "dismissed") {
    const closedAt = flag.closedAt ? formatDateTimeShort(parseApiDate(flag.closedAt)) : "—";
    const closedBy = flag.closedBy ?? "—";
    return (
      <WebAppCard title="Compliance Review">
        <p className="mb-2 text-sm text-gray-600">
          {flag.status === "resolved"
            ? "This flag has been reviewed and resolved. The decision and action are recorded permanently in the audit log."
            : "No violation was found. The flag is kept in the compliance records as history."}
        </p>
        <WebAppDetailList
          align="right"
          className="-mb-3"
          items={
            flag.status === "resolved"
              ? [
                  { label: "Compliance Decision", value: "Violation Confirmed" },
                  { label: "Action Taken", value: flag.action ? flagActionLabels[flag.action] : "—" },
                  { label: "Resolved by", value: closedBy },
                  { label: "Resolved at", value: closedAt },
                ]
              : [
                  { label: "Compliance Decision", value: "No Violation" },
                  { label: "Dismissed Reason", value: flag.dismissedReason ?? "—" },
                  { label: "Dismissed by", value: closedBy },
                  { label: "Dismissed at", value: closedAt },
                ]
          }
        />
      </WebAppCard>
    );
  }

  const actions = (Object.keys(actionOptions) as FlagAction[]).filter(
    (option) => option !== "campaign_cancelled" || Boolean(flag.campaignId),
  );

  const confirmViolation = async () => {
    if (!action) return;
    const done = await run(
      () => confirmFlagViolation(flag, action, adminName),
      `Violation confirmed. ${flagActionLabels[action]} applied.`,
      "We couldn't record this decision.",
    );
    if (done) setConfirming(false);
  };

  const dismiss = () => {
    const reason = dismissReason.trim();
    if (!reason) {
      setDismissError("Please explain why no violation was found.");
      return;
    }
    void run(() => dismissFlag(flag, reason, adminName), "The flag was dismissed: no violation.", "We couldn't dismiss this flag.");
  };

  return (
    <WebAppCard
      title={
        <span className="flex flex-wrap items-center gap-2">
          Compliance Review
          <WebAppBadge dot variant="info" className="text-blue-700">
            Review in progress
          </WebAppBadge>
        </span>
      }
      description="Review the flagged activity and record a decision."
    >
      <SectionLabel>Compliance Decision</SectionLabel>
      <div role="radiogroup" aria-label="Compliance decision" className="space-y-2">
        <OptionCard
          icon={CircleAlert}
          iconClassName="bg-red-50 text-red-600"
          title="Violation Confirmed"
          description="The activity is confirmed to breach platform guidelines."
          selected={decision === "violation"}
          onSelect={() => setDecision("violation")}
        />
        <OptionCard
          icon={ShieldCheck}
          iconClassName="bg-green-50 text-green-600"
          title="No Violation"
          description="No violation was found; this flag can be dismissed."
          selected={decision === "no_violation"}
          onSelect={() => setDecision("no_violation")}
        />
      </div>

      {decision === "violation" && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <SectionLabel>Take Action</SectionLabel>
          <p className="-mt-1 mb-3 text-xs text-gray-600">
            Select the action to apply. The platform applies it straight away (suspending or restricting the account,
            or cancelling the campaign) and records it in the audit log.
          </p>
          <div role="radiogroup" aria-label="Action" className="space-y-2">
            {actions.map((option) => (
              <OptionCard
                key={option}
                {...actionOptions[option]}
                title={flagActionLabels[option]}
                selected={action === option}
                onSelect={() => setAction(option)}
              />
            ))}
          </div>
          <WebAppButton
            className="mt-4"
            disabled={!action}
            leftIcon={<ArrowRight className="h-4 w-4" />}
            onClick={() => setConfirming(true)}
          >
            Confirm Action
          </WebAppButton>
        </div>
      )}

      {decision === "no_violation" && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <WebAppTextarea
            id="dismissReason"
            label="Dismissal Reason"
            required
            rows={3}
            maxLength={500}
            placeholder="Explain why no violation was found…"
            value={dismissReason}
            onChange={(event) => {
              setDismissReason(event.target.value);
              setDismissError("");
            }}
            error={dismissError || undefined}
            className="bg-stone-50"
          />
          <WebAppButton variant="outline" loading={busy} leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={dismiss}>
            Dismiss Flag
          </WebAppButton>
        </div>
      )}

      {action && (
        <WebAppModal open={confirming} onClose={() => setConfirming(false)} title={confirmCopy[action].title}>
          <p className="text-sm text-gray-600">{confirmCopy[action].text}</p>
          <div className="mt-5 flex justify-end gap-3">
            <WebAppButton variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </WebAppButton>
            <WebAppButton variant="danger" loading={busy} onClick={() => void confirmViolation()}>
              Confirm Action
            </WebAppButton>
          </div>
        </WebAppModal>
      )}
    </WebAppCard>
  );
};
