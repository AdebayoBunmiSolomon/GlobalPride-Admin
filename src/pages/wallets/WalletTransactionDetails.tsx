import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, Info, ReceiptText } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockWalletLedger } from "@/data/mock";
import { usePricing } from "@/hooks/usePricing";
import { triggerLabels } from "@/pages/pricing/pricingOptions";
import type { WalletLedgerEntry, WalletTransactionStatus } from "@/types/wallet";
import { formatLongDateTime, formatNaira } from "@/utils/format";
import { SignedAmount, TransactionStatusBadge } from "./WalletBadges";
import { paymentMethodLabels, transactionStatusStyles, transactionTypes } from "./walletOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Wallet Management", to: "/wallets" },
  { label: "Transaction Details" },
];

const backLink = { label: "Back to Transactions", to: "/wallets" };

const bonusStatusLabels: Record<WalletTransactionStatus, string> = {
  successful: "Issued",
  pending: "Pending",
  failed: "Failed",
  refunded: "Reversed",
};

type DetailItem = { label: string; value: ReactNode };

const TextLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-primary hover:underline">
    {children}
  </Link>
);

const creditLabels: Partial<Record<WalletLedgerEntry["type"], string>> = {
  wallet_funding: "Amount Funded",
  referral_bonus: "Bonus Credited",
  refund: "Refund Amount",
};

/** Balance rows (and an explanatory note) for how a transaction changed the user's wallet. */
const getWalletImpact = (
  transaction: WalletLedgerEntry,
  refund?: WalletLedgerEntry,
): { items: DetailItem[]; note?: { icon: ReactNode; text: ReactNode } } => {
  const { amount, previousBalance, status } = transaction;
  const isCredit = amount > 0;
  const previous = { label: "Previous Balance", value: formatNaira(previousBalance) };
  const links: DetailItem[] = [];

  if (transaction.campaignId) {
    links.push({
      label: "Campaign ID",
      value: <TextLink to={`/campaigns/${transaction.campaignId}`}>{transaction.campaignId}</TextLink>,
    });
  }
  if (transaction.originalTransactionId) {
    links.push({
      label: "Original Transaction",
      value: (
        <TextLink to={`/wallets/transactions/${transaction.originalTransactionId}`}>
          {transaction.originalTransactionId}
        </TextLink>
      ),
    });
  }

  if (status === "pending") {
    return {
      items: [
        previous,
        isCredit
          ? { label: "Pending Amount", value: <SignedAmount amount={amount} /> }
          : { label: "Pending Deduction", value: <SignedAmount amount={amount} /> },
        { label: "Current Balance", value: formatNaira(previousBalance) },
        ...links,
      ],
      note: {
        icon: <Clock className="h-3.5 w-3.5" />,
        text: "This transaction has not been completed yet. The wallet balance will update once it completes.",
      },
    };
  }

  if (status === "failed") {
    return {
      items: [
        previous,
        { label: isCredit ? "Attempted Credit" : "Attempted Deduction", value: formatNaira(Math.abs(amount)) },
        { label: isCredit ? "Actual Credit" : "Actual Deduction", value: formatNaira(0) },
        { label: "Current Balance", value: formatNaira(previousBalance) },
        ...links,
      ],
      note: {
        icon: <Info className="h-3.5 w-3.5" />,
        text: `This transaction failed, so the expected wallet ${isCredit ? "credit" : "deduction"} did not complete and the balance remains unchanged.`,
      },
    };
  }

  const items: DetailItem[] = [
    previous,
    {
      label: isCredit ? (creditLabels[transaction.type] ?? "Amount Credited") : "Amount Deducted",
      value: <SignedAmount amount={amount} />,
    },
    { label: "New Balance", value: formatNaira(previousBalance + amount) },
    ...links,
  ];

  // A deduction that was later refunded points to its refund.
  if (status === "refunded" && !isCredit && refund) {
    items.push({
      label: "Refund Transaction",
      value: <TextLink to={`/wallets/transactions/${refund.id}`}>{refund.id}</TextLink>,
    });
    return {
      items,
      note: {
        icon: <Info className="h-3.5 w-3.5" />,
        text: `This deduction was refunded to the user's wallet in ${refund.id}.`,
      },
    };
  }

  return { items };
};

export const WalletTransactionDetails = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const referralTrigger = usePricing((state) => state.referralBonus.trigger);
  const transaction = mockWalletLedger.find((item) => item.id === transactionId);

  if (!transaction) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="Transaction not found"
            description="This transaction doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Transactions", onClick: () => navigate("/wallets") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const refund = mockWalletLedger.find((item) => item.originalTransactionId === transaction.id);
  const impact = getWalletImpact(transaction, refund);
  const statusLabel = transactionStatusStyles[transaction.status].label;

  return (
    <div className="space-y-4">
      <WebAppPageHeader
        title="Transaction Details"
        description="View transaction information and wallet impact."
        breadcrumbs={breadcrumbs}
        backLink={backLink}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Transaction Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Transaction ID", value: transaction.id },
              {
                label: "User",
                value: <TextLink to={`/users/${transaction.userId}`}>{transaction.userName}</TextLink>,
              },
              { label: "Transaction Type", value: transactionTypes[transaction.type].label },
              { label: "Amount", value: <SignedAmount amount={transaction.amount} /> },
              { label: "Status", value: <TransactionStatusBadge status={transaction.status} /> },
              { label: "Date & Time", value: formatLongDateTime(transaction.createdAt) },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Wallet Impact">
          <WebAppDetailList align="right" className="-my-3" items={impact.items} />
          {impact.note && (
            <WebAppNote icon={impact.note.icon} className="mt-4">
              {impact.note.text}
            </WebAppNote>
          )}
        </WebAppCard>
      </div>

      {transaction.payment && (
        <WebAppCard title="Payment Information">
          <div className="-my-3 grid gap-x-8 md:grid-cols-2">
            <WebAppDetailList
              align="right"
              items={[
                { label: "Payment Reference", value: transaction.payment.reference },
                { label: "Payment Method", value: paymentMethodLabels[transaction.payment.method] },
              ]}
            />
            <WebAppDetailList align="right" items={[{ label: "Payment Status", value: statusLabel }]} />
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Wallet funding is a direct payment. Campaign deductions and audience rentals are wallet debits and do
            not use an external payment provider.
          </p>
        </WebAppCard>
      )}

      {transaction.type === "referral_bonus" && (
        <WebAppCard title="Referral Information">
          <div className="-my-3 grid gap-x-8 md:grid-cols-2">
            <WebAppDetailList
              align="right"
              items={[
                {
                  label: "Referral ID",
                  value: transaction.referralId ? (
                    <TextLink to={`/referrals/${transaction.referralId}`}>{transaction.referralId}</TextLink>
                  ) : (
                    "—"
                  ),
                },
                { label: "Referral Rule", value: triggerLabels[referralTrigger] },
              ]}
            />
            <WebAppDetailList
              align="right"
              items={[{ label: "Bonus Status", value: bonusStatusLabels[transaction.status] }]}
            />
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Referral bonuses are wallet credits issued through the referral programme. They are not platform
            revenue and are not counted in revenue reporting.
          </p>
        </WebAppCard>
      )}
    </div>
  );
};
