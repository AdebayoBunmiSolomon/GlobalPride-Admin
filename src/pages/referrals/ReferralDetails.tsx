import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, CircleCheck, CircleX, Clock, Info, UserPlus } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockReferrals } from "@/data/mock";
import { usePricing } from "@/hooks/usePricing";
import { useUsers } from "@/hooks/useUsers";
import { triggerLabels } from "@/pages/pricing/pricingOptions";
import { formatDate, formatDateOnly, formatNaira } from "@/utils/format";
import { BonusStatusBadge, ReferralStatusBadge } from "./ReferralBadges";
import { bonusStatusStyles, getReferralBonus, referralStatusStyles } from "./referralOptions";

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

export const ReferralDetails = () => {
  const { referralId } = useParams();
  const navigate = useNavigate();
  const referralBonus = usePricing((state) => state.referralBonus);
  const users = useUsers((state) => state.users);
  const referral = mockReferrals.find((item) => item.id === referralId);

  if (!referral) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title="Referral not found"
            description="This referral doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Referral Management", onClick: () => navigate("/referrals") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const bonus = getReferralBonus(referral, referralBonus.amount);
  const isQualified = referral.status === "successful";
  const registeredAt = users.find((user) => user.id === referral.referredUserId)?.joinedAt ?? referral.createdAt;

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
  const note = rewardNote[bonus.status];

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
              { label: "Referral ID", value: referral.id },
              { label: "Referral Code", value: referral.code },
              { label: "Referral Date", value: formatDateOnly(referral.createdAt) },
              { label: "Referral Status", value: referralStatusStyles[referral.status].label },
              { label: "Qualification Date", value: referral.qualifiedAt ? formatDate(referral.qualifiedAt) : "—" },
              { label: "Qualification Requirement", value: triggerLabels[referralBonus.trigger] },
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
              { label: "Name", value: referral.referrerName },
              { label: "User ID", value: <ArrowLink to={`/users/${referral.referrerId}`}>{referral.referrerId}</ArrowLink> },
            ]}
          />
          <div className="mt-4">
            <SectionLabel>Referred User</SectionLabel>
            <WebAppDetailList
              align="right"
              items={[
                { label: "Name", value: referral.referredUserName },
                {
                  label: "User ID",
                  value: <ArrowLink to={`/users/${referral.referredUserId}`}>{referral.referredUserId}</ArrowLink>,
                },
                { label: "Registration Date", value: formatDateOnly(registeredAt) },
              ]}
            />
          </div>
        </WebAppCard>
      </div>

      <WebAppCard title="Reward Information" action={<BonusStatusBadge status={bonus.status} />}>
        <div className="-my-3 grid gap-x-8 md:grid-cols-2">
          <WebAppDetailList
            align="right"
            items={[
              { label: "Eligible Bonus Amount", value: formatNaira(bonus.amount) },
              { label: "Bonus Status", value: bonusStatusStyles[bonus.status].label },
            ]}
          />
          <WebAppDetailList
            align="right"
            items={[
              {
                label: "Bonus Credit Date",
                value: bonus.status === "paid" && bonus.transaction ? formatDate(bonus.transaction.createdAt) : "—",
              },
              {
                label: "Wallet Transaction",
                value: bonus.transaction ? (
                  <ArrowLink to={`/wallets/transactions/${bonus.transaction.id}`}>{bonus.transaction.id}</ArrowLink>
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
          {formatNaira(referralBonus.amount)}).{" "}
          <ArrowLink to="/pricing">Pricing Management</ArrowLink>
        </p>
      </WebAppCard>
    </div>
  );
};
