import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CircleAlert, Clock, Info, ReceiptText, RefreshCw } from "lucide-react";

import type { AdminWalletTransactionDetails } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useWalletTransaction } from "@/store/walletsStore";
import { cn } from "@/utils/cn";
import { formatLongDateTime, formatNaira, parseApiDate } from "@/utils/format";
import { CategoryIcon, SignedAmount, WalletStatusBadge } from "./WalletBadges";
import { paymentMethodLabel, signedAmount, walletStatusStyle } from "./walletOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Wallet Management", to: "/wallets" },
  { label: "Transaction Details" },
];

const backLink = { label: "Back to Transactions", to: "/wallets" };

const TextLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-primary hover:underline">
    {children}
  </Link>
);

const when = (value: string | null) => (value ? formatLongDateTime(parseApiDate(value)) : "—");

/** Why the balance did or didn't change, for transactions that haven't completed. */
const impactNote = ({ status, direction }: AdminWalletTransactionDetails) => {
  if (status === "pending" || status === "processing") {
    return {
      icon: <Clock />,
      text:
        direction === "credit"
          ? "This funding hasn't been confirmed by the payment provider yet. The wallet is credited once it succeeds."
          : "This transaction hasn't completed yet. The wallet balance updates once it does.",
    };
  }
  if (status === "failed" || status === "cancelled") {
    return {
      icon: <Info />,
      text: `This transaction ${status === "failed" ? "failed" : "was cancelled"}, so the wallet ${direction === "credit" ? "was not credited" : "was not charged"}.`,
    };
  }
  return null;
};

export const WalletTransactionDetails = () => {
  const { transactionId = "" } = useParams();
  const navigate = useNavigate();
  const { data: transaction, error, loading, refresh } = useWalletTransaction(transactionId);

  if (!transaction) {
    const notFound = error?.status === 404 || error?.status === 400;
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={notFound ? <ReceiptText className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
              title={notFound ? "Transaction not found" : "Couldn't load this transaction"}
              description={notFound ? "This transaction doesn't exist, or the link is incorrect." : error.message}
              primaryAction={
                notFound
                  ? { label: "Back to Transactions", onClick: () => navigate("/wallets") }
                  : { label: "Try again", onClick: refresh }
              }
            />
          </WebAppCard>
        ) : (
          <div className="space-y-4" aria-busy={loading} aria-label="Loading transaction">
            <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const note = impactNote(transaction);
  const isFunding = transaction.category === "funding";
  const card = transaction.cardLast4
    ? `${transaction.cardType ?? "Card"} •••• ${transaction.cardLast4}`
    : transaction.cardType;

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />

      <WebAppCard bodyClassName="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CategoryIcon category={transaction.category} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{transaction.type}</h1>
              <WalletStatusBadge status={transaction.status} />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {transaction.id} ·{" "}
              <Link to={`/users/${transaction.userId}`} className="font-medium text-gray-900 hover:underline">
                {transaction.userName}
              </Link>{" "}
              · {when(transaction.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SignedAmount amount={signedAmount(transaction)} className="text-2xl font-bold" />
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh transaction"
            title="Refresh"
            className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </WebAppCard>

      {transaction.description && (
        <WebAppNote icon={<Info />} className="text-sm">
          {transaction.description}
        </WebAppNote>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Transaction Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Reference", value: transaction.id },
              { label: "Transaction GUID", value: <span className="break-all">{transaction.transactionGuid}</span> },
              { label: "User", value: <TextLink to={`/users/${transaction.userId}`}>{transaction.userName}</TextLink> },
              { label: "Transaction Type", value: transaction.type },
              { label: "Direction", value: transaction.direction === "credit" ? "Credit" : "Debit" },
              { label: "Amount", value: <SignedAmount amount={signedAmount(transaction)} /> },
              { label: "Status", value: <WalletStatusBadge status={transaction.status} /> },
              { label: "Created", value: when(transaction.createdAt) },
              { label: "Last Updated", value: when(transaction.updatedAt) },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Wallet Impact">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Amount Credited", value: formatNaira(transaction.amountCredited) },
              { label: "Amount Deducted", value: formatNaira(transaction.amountDeducted) },
              { label: "User's Current Balance", value: formatNaira(transaction.currentWalletBalance) },
              ...(transaction.campaignId
                ? [
                    {
                      label: "Campaign",
                      value: (
                        <TextLink to={`/campaigns/${encodeURIComponent(transaction.campaignId)}`}>
                          {transaction.campaignName
                            ? `${transaction.campaignName} (${transaction.campaignId})`
                            : transaction.campaignId}
                        </TextLink>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <WebAppNote icon={note?.icon ?? <Info />} tone={note ? "warning" : "neutral"} className="mt-4">
            {note?.text ?? "The current balance is the user's wallet balance now, after all their transactions."}
          </WebAppNote>
        </WebAppCard>
      </div>

      {(isFunding || transaction.paymentReference || card || transaction.bankName) && (
        <WebAppCard title="Payment Information">
          <div className="-my-3 grid gap-x-8 md:grid-cols-2">
            <WebAppDetailList
              align="right"
              items={[
                { label: "Payment Reference", value: transaction.paymentReference ?? "—" },
                { label: "Payment Method", value: paymentMethodLabel(transaction.paymentMethod) },
              ]}
            />
            <WebAppDetailList
              align="right"
              items={[
                ...(card ? [{ label: "Card", value: card }] : []),
                ...(transaction.bankName ? [{ label: "Bank", value: transaction.bankName }] : []),
                { label: "Payment Status", value: walletStatusStyle(transaction.status).label },
              ]}
            />
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Wallet funding is a direct payment. Campaign charges and audience rentals are wallet debits and do not use
            an external payment provider.
          </p>
        </WebAppCard>
      )}
    </div>
  );
};
