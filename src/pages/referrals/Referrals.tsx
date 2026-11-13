import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, CircleCheck, Clock, Gift, Search, UserPlus, UserStar } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { mockReferrals, referralProgramStats } from "@/data/mock";
import { usePricing } from "@/hooks/usePricing";
import { dateRangeOptions, getDateFrom } from "@/utils/dateRange";
import { formatDateOnly, formatNaira } from "@/utils/format";
import { BonusStatusBadge, ReferralStatusBadge } from "./ReferralBadges";
import { bonusStatusOptions, getReferralBonus, referralStatusOptions } from "./referralOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const Referrals = () => {
  const configuredBonus = usePricing((state) => state.referralBonus.amount);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [bonusStatus, setBonusStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(1);

  const referrals = useMemo(
    () => mockReferrals.map((referral) => ({ ...referral, bonus: getReferralBonus(referral, configuredBonus) })),
    [configuredBonus],
  );

  // TODO: move search / filters / paging to the API once the referrals endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = getDateFrom(dateRange);

    return referrals
      .filter(
        (referral) =>
          (status === "all" || referral.status === status) &&
          (bonusStatus === "all" || referral.bonus.status === bonusStatus) &&
          new Date(`${referral.createdAt}T00:00:00`).getTime() >= from &&
          (!query ||
            [referral.id, referral.code, referral.referrerName, referral.referredUserName].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  }, [referrals, search, status, bonusStatus, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReferrals = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Referral Management"
        description="Monitor referral activity, qualification and reward payments."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Referral Management" }]}
      />

      <div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WebAppStatCard
            label="Total Referrals"
            value={referralProgramStats.total.toLocaleString()}
            note="Referral records created since platform launch."
            icon={UserStar}
          />
          <WebAppStatCard
            label="Successful Referrals"
            value={referralProgramStats.successful.toLocaleString()}
            note="Referrals that met the configured qualification requirements."
            icon={CircleCheck}
          />
          <WebAppStatCard
            label="Pending Referrals"
            value={referralProgramStats.pending.toLocaleString()}
            note="Referrals still awaiting qualification."
            icon={Clock}
          />
          <WebAppStatCard
            label="Referral Bonuses Paid"
            value={formatNaira(referralProgramStats.bonusesPaid)}
            note="Referral credits successfully posted to wallets since launch."
            icon={Gift}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Bonus amounts & rules
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <WebAppCard
        title="Referral Records"
        description="View referred users, qualification status and reward progress."
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="referralSearch"
            type="search"
            placeholder="Search referral ID, name or code"
            aria-label="Search referral ID, name or code"
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
            id="referralStatus"
            options={referralStatusOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          <WebAppSelectInput
            id="bonusStatus"
            options={bonusStatusOptions}
            value={bonusStatus}
            onChange={withPageReset(setBonusStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-48"
          />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="shrink-0 text-xs font-medium text-gray-600">Referral Date</span>
            <WebAppSelectInput
              id="referralDate"
              options={dateRangeOptions}
              value={dateRange}
              onChange={withPageReset(setDateRange)}
              leftIcon={<CalendarDays className="h-4 w-4" />}
              fullWidth={false}
              containerClassName="w-full sm:w-44"
            />
          </div>
        </div>

        {pageReferrals.length === 0 ? (
          <WebAppEmptyState
            icon={<UserPlus className="h-6 w-6" />}
            title="No referrals found"
            description="Try a different search term, filter or date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Referral ID</th>
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
                {pageReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{referral.id}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/users/${referral.referrerId}`} className={linkClass}>
                        {referral.referrerName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/users/${referral.referredUserId}`} className={linkClass}>
                        {referral.referredUserName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDateOnly(referral.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <ReferralStatusBadge status={referral.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <BonusStatusBadge status={referral.bonus.status} />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{formatNaira(referral.bonus.amount)}</td>
                    <td className="px-5 py-3.5">
                      <Link to={`/referrals/${referral.id}`} className={linkClass}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
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
            itemLabel="referrals"
          />
        )}
      </WebAppCard>
    </div>
  );
};
