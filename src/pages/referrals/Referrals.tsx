import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CircleAlert, CircleCheck, Clock, Gift, RefreshCw, Search, UserPlus, UserStar } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { referralSummaryQuery, useReferralSummary, useReferrals } from "@/store/referralsStore";
import { cn } from "@/utils/cn";
import { dateRangeOptions, getDateFrom } from "@/utils/dateRange";
import { formatDateTimeShort, formatNaira, parseApiDate } from "@/utils/format";
import { BonusStatusBadge, ReferralStatusBadge } from "./ReferralBadges";
import { bonusAmountOf, bonusStatusOptions, referralStatusOptions, referredLabel } from "./referralOptions";

const PAGE_SIZE = 20;

const linkClass = "font-medium text-primary hover:underline";

export const Referrals = () => {
  // Filters live in the URL so "Back to Referral Management" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({
    status: "all",
    bonus: "all",
    range: "all",
    page: "1",
  });
  const search = get("q");
  const status = referralStatusOptions.find((option) => option.value === get("status"))?.value ?? "all";
  const bonusStatus = bonusStatusOptions.find((option) => option.value === get("bonus"))?.value ?? "all";
  const range = dateRangeOptions.find((option) => option.value === get("range"))?.value ?? "all";

  const { data: summary, error: summaryError } = useReferralSummary();
  // Every referral is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: referrals, error, loading, refresh } = useReferrals();
  const configuredBonus = summary?.currentBonusAmount ?? null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = getDateFrom(range);

    return (referrals ?? []).filter(
      (referral) =>
        (status === "all" || referral.status === status) &&
        (bonusStatus === "all" || referral.bonusStatus === bonusStatus) &&
        (from === 0 || (referral.createdAt !== null && parseApiDate(referral.createdAt).getTime() >= from)) &&
        (!query ||
          [
            referral.id,
            referral.code,
            referral.referrerName,
            referral.referredUserName,
            referral.inviteeContact,
          ].some((field) => field?.toLowerCase().includes(query))),
    );
  }, [referrals, search, status, bonusStatus, range]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageReferrals = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const refreshAll = () => {
    void referralSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const total = referrals?.length ?? 0;
  const description = !referrals
    ? "Loading referrals…"
    : filtered.length === total
      ? `${total.toLocaleString()} referrals`
      : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} referrals`;

  const count = (value: number | undefined) => (value === undefined ? "…" : value.toLocaleString());

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Referral Management"
        description="Monitor referral activity, qualification and reward payments."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Referral Management" }]}
        actions={
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            aria-label="Refresh referrals"
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
          Couldn't load the referral summary: {summaryError.message}
        </p>
      )}

      <div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WebAppStatCard
            label="Total Referrals"
            value={count(summary?.totalReferrals)}
            note="Referral records created since platform launch."
            icon={UserStar}
          />
          <WebAppStatCard
            label="Successful Referrals"
            value={count(summary?.successfulReferrals)}
            note="Referrals that met the configured qualification requirements."
            icon={CircleCheck}
          />
          <WebAppStatCard
            label="Pending Referrals"
            value={count(summary?.pendingReferrals)}
            note="Referrals still awaiting qualification."
            icon={Clock}
          />
          <WebAppStatCard
            label="Referral Bonuses Paid"
            value={summary ? formatNaira(summary.totalBonusPaid) : "…"}
            note="Referral credits successfully posted to wallets since launch."
            icon={Gift}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs">
          {summary && (
            <span className="text-gray-600">Current bonus: {formatNaira(summary.currentBonusAmount)} per referral</span>
          )}
          <Link to="/pricing" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Bonus amounts & rules
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <WebAppCard
        divided
        title="Referral Records"
        description={description}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 xl:w-auto">
            <WebAppInput
              id="referralSearch"
              type="search"
              placeholder="Search name, code or contact"
              aria-label="Search by referrer, referred user, referral code or invited contact"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => update({ q: event.target.value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-64"
            />
            <WebAppSelectInput
              id="referralStatus"
              aria-label="Referral status"
              options={referralStatusOptions}
              value={status}
              onChange={(value) => update({ status: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
            <WebAppSelectInput
              id="bonusStatus"
              aria-label="Bonus status"
              options={bonusStatusOptions}
              value={bonusStatus}
              onChange={(value) => update({ bonus: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-48"
            />
            <WebAppSelectInput
              id="referralDate"
              aria-label="Referral date"
              options={dateRangeOptions}
              value={range}
              onChange={(value) => update({ range: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
          </div>
        }
      >
        {!referrals ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load referrals"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <div className="space-y-2 p-5" aria-busy="true" aria-label="Loading referrals">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          )
        ) : pageReferrals.length === 0 ? (
          <WebAppEmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title="No referrals found"
            description={total === 0 ? "No referrals yet." : "Try a different search term, filter or date range."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Referral Code</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Referrer</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Referred User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Referral Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Referral Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Bonus Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Bonus Amount</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageReferrals.map((referral) => {
                  const bonusAmount = bonusAmountOf(referral, configuredBonus);
                  return (
                    <tr key={referral.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{referral.code ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {referral.referrerId ? (
                          <Link to={`/users/${referral.referrerId}`} className={linkClass}>
                            {referral.referrerName ?? "View user"}
                          </Link>
                        ) : (
                          <span className="text-gray-700">{referral.referrerName ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {referral.referredUserId ? (
                          <Link to={`/users/${referral.referredUserId}`} className={linkClass}>
                            {referredLabel(referral)}
                          </Link>
                        ) : (
                          <span className="text-gray-700">{referredLabel(referral)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                        {referral.createdAt ? formatDateTimeShort(parseApiDate(referral.createdAt)) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <ReferralStatusBadge status={referral.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <BonusStatusBadge status={referral.bonusStatus} />
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {bonusAmount === null ? "—" : formatNaira(bonusAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/referrals/${encodeURIComponent(referral.id)}`} className={linkClass}>
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
            itemLabel="referrals"
          />
        )}
      </WebAppCard>
    </div>
  );
};
