import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, CircleDollarSign, Gift, ReceiptText, Search, Wallet } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { mockWalletLedger, walletStats } from "@/data/mock";
import { dateRangeOptions, getDateFrom } from "@/utils/dateRange";
import { formatCompactNaira, formatDate } from "@/utils/format";
import { SignedAmount, TransactionStatusBadge } from "./WalletBadges";
import { statusOptions, transactionTypes, typeOptions } from "./walletOptions";

const PAGE_SIZE = 10;

export const Wallets = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);

  // TODO: move search / filters / paging to the API once the wallet transactions endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = getDateFrom(dateRange);

    return mockWalletLedger
      .filter(
        (transaction) =>
          (type === "all" || transaction.type === type) &&
          (status === "all" || transaction.status === status) &&
          new Date(transaction.createdAt).getTime() >= from &&
          (!query ||
            transaction.id.toLowerCase().includes(query) ||
            transaction.userName.toLowerCase().includes(query)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [search, type, status, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageTransactions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Wallet Management"
        description="Monitor wallet balances, transactions and payments."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Wallet Management" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total User Wallet Balance"
          value={formatCompactNaira(walletStats.totalBalance)}
          note="Current balance held across all user wallets"
          icon={Wallet}
        />
        <WebAppStatCard
          label="Total Wallet Funding"
          value={formatCompactNaira(walletStats.totalFunding)}
          note="Total successful wallet funding"
          icon={CircleDollarSign}
        />
        <WebAppStatCard
          label="Referral Bonuses Paid"
          value={formatCompactNaira(walletStats.referralBonusesPaid)}
          note="Total successful referral bonus credits"
          icon={Gift}
        />
        <WebAppStatCard
          label="Transactions"
          value={walletStats.transactionCount.toLocaleString()}
          note="Total wallet transactions"
          icon={ArrowLeftRight}
        />
      </div>

      <WebAppCard
        divided
        title="Wallet Transactions"
        description={`${filtered.length.toLocaleString()} transactions`}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 xl:w-auto">
            <WebAppInput
              id="transactionSearch"
              type="search"
              placeholder="Search by transaction ID or user"
              aria-label="Search by transaction ID or user"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-64"
            />
            <WebAppSelectInput
              id="transactionType"
              options={typeOptions}
              value={type}
              onChange={withPageReset(setType)}
              fullWidth={false}
              containerClassName="w-full sm:w-44"
            />
            <WebAppSelectInput
              id="transactionStatus"
              options={statusOptions}
              value={status}
              onChange={withPageReset(setStatus)}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
            <WebAppSelectInput
              id="transactionDate"
              options={dateRangeOptions}
              value={dateRange}
              onChange={withPageReset(setDateRange)}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
          </div>
        }
      >
        {pageTransactions.length === 0 ? (
          <WebAppEmptyState
            icon={<ReceiptText className="h-6 w-6" />}
            title="No transactions found"
            description="Try a different search term, filter or date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Transaction</th>
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
                  const { label, icon: TypeIcon } = transactionTypes[transaction.type];

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50/60">
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
                          <TypeIcon className="h-4 w-4 text-gray-500" />
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <SignedAmount amount={transaction.amount} />
                      </td>
                      <td className="px-5 py-3.5">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{formatDate(transaction.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/wallets/transactions/${transaction.id}`}
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
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel="transactions"
          />
        )}
      </WebAppCard>
    </div>
  );
};
