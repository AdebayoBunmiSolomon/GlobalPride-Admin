import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, CircleAlert, CircleDollarSign, Gift, ReceiptText, RefreshCw, Search, Wallet } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { useWalletSummary, useWalletTransactions, walletSummaryQuery } from "@/store/walletsStore";
import { cn } from "@/utils/cn";
import { dateRangeOptions, getDateFrom } from "@/utils/dateRange";
import { formatCompactNaira, formatDateTimeShort, parseApiDate } from "@/utils/format";
import { CategoryIcon, SignedAmount, WalletStatusBadge } from "./WalletBadges";
import { categoryOptions, signedAmount, walletStatusOptions } from "./walletOptions";

const PAGE_SIZE = 20;

export const Wallets = () => {
  // Filters live in the URL so "Back to Transactions" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({
    category: "all",
    status: "all",
    range: "all",
    page: "1",
  });
  const search = get("q");
  const category = categoryOptions.find((option) => option.value === get("category"))?.value ?? "all";
  const status = walletStatusOptions.find((option) => option.value === get("status"))?.value ?? "all";
  const range = dateRangeOptions.find((option) => option.value === get("range"))?.value ?? "all";

  const { data: summary, error: summaryError } = useWalletSummary();
  // Every transaction is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: transactions, error, loading, refresh } = useWalletTransactions();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = getDateFrom(range);

    return (transactions ?? []).filter(
      (transaction) =>
        (category === "all" || transaction.category === category) &&
        (status === "all" || transaction.status === status) &&
        (from === 0 || parseApiDate(transaction.createdAt).getTime() >= from) &&
        (!query ||
          [transaction.id, transaction.transactionGuid, transaction.userName].some((field) =>
            field?.toLowerCase().includes(query),
          )),
    );
  }, [transactions, search, category, status, range]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageTransactions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const refreshAll = () => {
    void walletSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const total = transactions?.length ?? 0;
  const description = !transactions
    ? "Loading transactions…"
    : filtered.length === total
      ? `${total.toLocaleString()} transactions`
      : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} transactions`;

  const money = (value: number | undefined) => (value === undefined ? "…" : formatCompactNaira(value));

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Wallet Management"
        description="Monitor wallet balances, transactions and payments."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Wallet Management" }]}
        actions={
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            aria-label="Refresh wallets"
            title="Refresh"
            className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        }
      />

      {summaryError && !summary && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <CircleAlert className="h-4 w-4" />
          Couldn't load the wallet summary: {summaryError.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total User Wallet Balance"
          value={money(summary?.totalWalletBalance)}
          note="Current balance held across all user wallets"
          icon={Wallet}
        />
        <WebAppStatCard
          label="Total Wallet Funding"
          value={money(summary?.totalWalletFunding)}
          note="Total successful wallet funding"
          icon={CircleDollarSign}
        />
        <WebAppStatCard
          label="Referral Bonuses Paid"
          value={money(summary?.totalReferralBonusCredits)}
          note="Total referral bonus wallet credits"
          icon={Gift}
        />
        <WebAppStatCard
          label="Transactions"
          value={summary ? summary.totalTransactions.toLocaleString() : "…"}
          note={
            summary
              ? `${summary.pendingTransactions.toLocaleString()} pending · ${summary.failedTransactions.toLocaleString()} failed`
              : "Total wallet transactions"
          }
          icon={ArrowLeftRight}
        />
      </div>

      <WebAppCard
        divided
        title="Wallet Transactions"
        description={description}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 xl:w-auto">
            <WebAppInput
              id="transactionSearch"
              type="search"
              placeholder="Search by reference or user"
              aria-label="Search by transaction reference or user"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => update({ q: event.target.value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-64"
            />
            <WebAppSelectInput
              id="transactionType"
              aria-label="Type"
              options={categoryOptions}
              value={category}
              onChange={(value) => update({ category: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-44"
            />
            <WebAppSelectInput
              id="transactionStatus"
              aria-label="Status"
              options={walletStatusOptions}
              value={status}
              onChange={(value) => update({ status: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
            <WebAppSelectInput
              id="transactionDate"
              aria-label="Date range"
              options={dateRangeOptions}
              value={range}
              onChange={(value) => update({ range: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
          </div>
        }
      >
        {!transactions ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load transactions"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <div className="space-y-2 p-5" aria-busy="true" aria-label="Loading transactions">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          )
        ) : pageTransactions.length === 0 ? (
          <WebAppEmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="No transactions found"
            description={
              total === 0 ? "No wallet transactions yet." : "Try a different search term, filter or date range."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Reference</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Amount</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageTransactions.map((transaction) => {
                  return (
                    <tr key={transaction.transactionGuid} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{transaction.id}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/users/${transaction.userId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {transaction.userName}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        <span className="inline-flex items-center gap-2">
                          <CategoryIcon category={transaction.category} className="h-4 w-4 text-gray-500" />
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <SignedAmount amount={signedAmount(transaction)} />
                      </td>
                      <td className="px-5 py-3.5">
                        <WalletStatusBadge status={transaction.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                        {formatDateTimeShort(parseApiDate(transaction.createdAt))}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/wallets/transactions/${encodeURIComponent(transaction.id)}`}
                          className="font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel="transactions"
          />
        )}
      </WebAppCard>
    </div>
  );
};
