import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, CircleAlert, CircleCheck, CircleX, Clock, Info, UserPlus } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { triggerLabel } from "@/pages/pricing/pricingOptions";
import { useReferralBonusSettings } from "@/store/pricingStore";
import { useReferral, useReferralSummary } from "@/store/referralsStore";
import { formatLongDateTime, formatNaira, parseApiDate } from "@/utils/format";
import { BonusStatusBadge, ReferralStatusBadge } from "./ReferralBadges";
import { bonusAmountOf, bonusStatusStyles, referralStatusStyles } from "./referralOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Referral Management", to: "/referrals" },
  { label: "Referral Details" },
];

const backLink = { label: "Back to Referral Management", to: "/referrals" };

const ArrowLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="inline-flex items-center gap-1 text-primary hover:underline">
    {children}
    <ArrowUpRight className="h-3.5 w-3.5" />
  </Link>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="pt-1 text-xs font-semibold text-gray-600">{children}</p>
);

const when = (value: string | null) => (value ? formatLongDateTime(parseApiDate(value)) : "—");

export const ReferralDetails = () => {
  const { referralId = "" } = useParams();
  const navigate = useNavigate();
  const { data: referral, error, loading, refresh } = useReferral(referralId);
  const { data: summary } = useReferralSummary();
  // Only for the qualification rule (the trigger); the amount comes from the referral summary.
  const referralBonus = useReferralBonusSettings();

  if (!referral) {
    const notFound = error?.status === 404 || error?.status === 400;
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={notFound ? <UserPlus className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
              title={notFound ? "Referral not found" : "Couldn't load this referral"}
              description={notFound ? "This referral doesn't exist, or the link is incorrect." : error.message}
              primaryAction={
                notFound
                  ? { label: "Back to Referral Management", onClick: () => navigate("/referrals") }
                  : { label: "Try again", onClick: refresh }
              }
            />
          </WebAppCard>
        ) : (
          <div className="space-y-4" aria-busy={loading} aria-label="Loading referral">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
            </div>
            <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
          </div>
        )}
      </div>
    );
  }

  const configuredBonus = summary?.currentBonusAmount ?? null;
  const bonusAmount = bonusAmountOf(referral, configuredBonus);
  const isQualified = referral.status === "successful";

  const rewardNote = {
    paid: { tone: "success", icon: <CircleCheck />, text: "This bonus was successfully credited to the referrer's wallet." },
    failed: {
      tone: "danger",
      icon: <CircleX />,
      text: "The bonus credit failed, so nothing was added to the referrer's wallet.",
    },
    pending: {
      tone: "warning",
      icon: <Clock />,
      text: isQualified
        ? "This referral has qualified and the bonus credit is still processing. The referrer's wallet updates once it completes."
        : "This referral is still awaiting qualification, so the bonus has not been issued yet. It will only be credited once the referral qualifies.",
    },
  } as const;
  const note = rewardNote[referral.bonusStatus];

  return (
    <div className="space-y-4">
      <WebAppPageHeader
        title="Referral Details"
        description="View referral qualification and associated reward information."
        breadcrumbs={breadcrumbs}
        backLink={backLink}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Referral Information" action={<ReferralStatusBadge status={referral.status} />}>
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Referral Code", value: referral.code ?? "—" },
              { label: "Referral Date", value: when(referral.createdAt) },
              { label: "Referral Status", value: referralStatusStyles[referral.status].label },
              { label: "Qualification Date", value: when(referral.qualifiedAt) },
              { label: "Qualification Requirement", value: referralBonus ? triggerLabel(referralBonus.trigger) : "—" },
            ]}
          />
          <WebAppNote icon={<Info />} className="mt-6">
            {isQualified
              ? "The referral met the configured referral qualification requirements."
              : "Awaiting the configured referral qualification requirements."}
          </WebAppNote>
        </WebAppCard>

        <WebAppCard title="People Involved">
          <SectionLabel>Referrer</SectionLabel>
          <WebAppDetailList
            align="right"
            items={[
              { label: "Name", value: referral.referrerName ?? "—" },
              {
                label: "User",
                value: referral.referrerId ? <ArrowLink to={`/users/${referral.referrerId}`}>View user</ArrowLink> : "—",
              },
            ]}
          />
          <div className="mt-4">
            <SectionLabel>Referred User</SectionLabel>
            <WebAppDetailList
              align="right"
              items={[
                { label: "Name", value: referral.referredUserName ?? "Not signed up yet" },
                { label: "Invited Contact", value: referral.inviteeContact ?? "—" },
                {
                  label: "User",
                  value: referral.referredUserId ? (
                    <ArrowLink to={`/users/${referral.referredUserId}`}>View user</ArrowLink>
                  ) : (
                    "—"
                  ),
                },
                { label: "Registration Date", value: when(referral.joinedAt) },
              ]}
            />
          </div>
        </WebAppCard>
      </div>

      <WebAppCard title="Reward Information" action={<BonusStatusBadge status={referral.bonusStatus} />}>
        <div className="-my-3 grid gap-x-8 md:grid-cols-2">
          <WebAppDetailList
            align="right"
            items={[
              { label: "Eligible Bonus Amount", value: bonusAmount === null ? "—" : formatNaira(bonusAmount) },
              { label: "Bonus Status", value: bonusStatusStyles[referral.bonusStatus].label },
            ]}
          />
          <WebAppDetailList
            align="right"
            items={[
              {
                label: "Bonus Credit Date",
                value: referral.bonusStatus === "paid" ? when(referral.bonusCreditedAt) : "—",
              },
              {
                label: "Wallet Transaction",
                value: referral.bonusTransactionId ? (
                  <ArrowLink to={`/wallets/transactions/${encodeURIComponent(referral.bonusTransactionId)}`}>
                    {referral.bonusTransactionId}
                  </ArrowLink>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        </div>

        <WebAppNote tone={note.tone} icon={note.icon} className="mt-6">
          {note.text}
        </WebAppNote>

        <p className="mt-4 text-xs text-gray-500">
          Bonus amounts and qualification rules come from the referral configuration (current configured bonus:{" "}
          {configuredBonus === null ? "—" : formatNaira(configuredBonus)}).{" "}
          <ArrowLink to="/pricing">Pricing Management</ArrowLink>
        </p>
      </WebAppCard>
    </div>
  );
};
