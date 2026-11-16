import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CircleAlert,
  CircleDollarSign,
  CircleX,
  Gift,
  Megaphone,
  MessageCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react";

import type { DashboardRange, DashboardSummary } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import { cn } from "@/utils/cn";
import { formatNaira, formatRelativeTime, parseApiDate, formatDateTimeShort } from "@/utils/format";
import { toneStyles, type Tone } from "@/utils/tones";
import { activityStyle, humanizeType } from "@/pages/shared/activityStyle";
import { useDashboardSummary } from "@/store/dashboardStore";
import { CampaignPerformanceChart, RevenueChart } from "./charts";

const dateRanges: { label: string; value: DashboardRange; period: string }[] = [
  { label: "Today", value: "today", period: "today" },
  { label: "Last 7 Days", value: "7d", period: "in the last 7 days" },
  { label: "Last 30 Days", value: "30d", period: "in the last 30 days" },
  { label: "Last 90 Days", value: "90d", period: "in the last 90 days" },
  { label: "All Time", value: "all", period: "all time" },
];

const DEFAULT_RANGE: DashboardRange = "30d";

const statusColors: Record<string, string> = {
  active: "bg-green-600",
  running: "bg-green-600",
  scheduled: "bg-blue-500",
  pending: "bg-amber-500",
  completed: "bg-stone-400",
  failed: "bg-red-500",
  cancelled: "bg-gray-300",
};

const sumBy = <T,>(items: T[], pick: (item: T) => number) => items.reduce((sum, item) => sum + pick(item), 0);

const StatsSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
    <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="h-80 animate-pulse rounded-xl bg-gray-100 lg:col-span-3" />
      <div className="h-80 animate-pulse rounded-xl bg-gray-100 lg:col-span-2" />
    </div>
  </div>
);

const DashboardContent = ({ data, period }: { data: DashboardSummary; period: string }) => {
  const { stats, requiresAttention, referrals } = data;
  const isAllTime = data.range === "all";

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      note: `${stats.newUsers.toLocaleString()} new ${period}`,
      icon: Users,
      tone: "purple" as Tone,
    },
    {
      label: "Total Revenue",
      value: formatNaira(stats.revenue),
      note: `${stats.revenueIncludesVat ? "Including" : "Excluding"} VAT · ${period}`,
      icon: Wallet,
      tone: "purple" as Tone,
      highlighted: true,
    },
    {
      label: "Campaigns",
      value: stats.totalCampaigns.toLocaleString(),
      note: `Created ${period}`,
      icon: Megaphone,
      tone: "blue" as Tone,
    },
    {
      label: "Messages Sent",
      value: stats.messagesSent.toLocaleString(),
      note: `Sent ${period}`,
      icon: MessageCircle,
      tone: "green" as Tone,
    },
    {
      label: "Successful Referrals",
      value: referrals.successful.toLocaleString(),
      note: `${referrals.pending.toLocaleString()} pending`,
      icon: UserCheck,
      tone: "gray" as Tone,
    },
    {
      label: "Referral Bonuses Paid",
      value: formatNaira(referrals.bonusPaid),
      note: `${referrals.total.toLocaleString()} referrals in total`,
      icon: Gift,
      tone: "green" as Tone,
    },
  ];

  const attentionItems = [
    {
      title: "Failed Campaigns",
      description: "Campaigns that failed to send.",
      count: requiresAttention.failedCampaigns,
      action: "View Campaigns",
      to: "/campaigns?status=failed",
      icon: CircleAlert,
      tone: "red" as Tone,
    },
    {
      title: "Pending Transactions",
      description: "Wallet transactions awaiting confirmation.",
      count: requiresAttention.pendingTransactions,
      action: "View Transactions",
      to: "/wallets",
      icon: CircleDollarSign,
      tone: "amber" as Tone,
    },
    {
      title: "Failed Transactions",
      description: "Wallet transactions that did not complete.",
      count: requiresAttention.failedTransactions,
      action: "View Transactions",
      to: "/wallets",
      icon: CircleX,
      tone: "red" as Tone,
    },
    {
      title: "Suspended Users",
      description: "Accounts currently suspended.",
      count: requiresAttention.suspendedUsers,
      action: "View Users",
      to: "/users?status=suspended",
      icon: UserX,
      tone: "gray" as Tone,
    },
  ];

  const revenueSources = [
    { label: "SMS Campaigns", value: sumBy(data.revenueOverview, (d) => d.sms), color: "bg-violet-500" },
    { label: "Image Campaigns", value: sumBy(data.revenueOverview, (d) => d.image), color: "bg-blue-500" },
    { label: "Audience Rental", value: sumBy(data.revenueOverview, (d) => d.audienceRental), color: "bg-green-600" },
  ];

  const statusTotal = sumBy(data.campaignStatus, (item) => item.count);

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border p-4",
              stat.highlighted ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-white",
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-700">{stat.label}</p>
              <span className={cn("rounded-md p-1.5", toneStyles[stat.tone].icon)}>
                <stat.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Requires attention */}
      <WebAppCard title="Requires Attention" description="Items that may require admin review or action.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => {
            const tone = toneStyles[item.count > 0 ? item.tone : "gray"];
            return (
              <div key={item.title} className="flex flex-col rounded-lg border border-gray-200 bg-stone-50 p-3">
                <div className="flex items-start justify-between">
                  <span className={cn("rounded-md p-1.5", tone.icon)}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className={cn("text-lg font-bold", tone.text)}>{item.count.toLocaleString()}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 flex-1 text-xs text-gray-500">{item.description}</p>
                <Link
                  to={item.to}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {item.action}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </WebAppCard>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <WebAppCard
          className="lg:col-span-3"
          title="Campaign Performance"
          description={
            isAllTime
              ? "Campaigns created and messages sent per day · last 90 days."
              : "Campaigns created and messages sent per day."
          }
        >
          <CampaignPerformanceChart data={data.campaignPerformance} />
        </WebAppCard>

        <WebAppCard className="lg:col-span-2" title="Revenue Overview" description="Revenue trend across platform sources.">
          <p className="text-2xl font-bold text-gray-900">{formatNaira(stats.revenue)}</p>
          <p className="text-xs text-gray-500">
            Total Revenue · {period.replace(/^in the /, "")}
          </p>
          <RevenueChart data={data.revenueOverview} />
          <ul className="mt-4 space-y-3">
            {revenueSources.map((source) => (
              <li key={source.label} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2 w-2 rounded-full", source.color)} />
                <span className="flex-1 text-gray-600">{source.label}</span>
                <span className="font-semibold text-gray-900">{formatNaira(source.value)}</span>
              </li>
            ))}
          </ul>
          {isAllTime && <p className="mt-3 text-xs text-gray-500">Chart and breakdown cover the last 90 days.</p>}
        </WebAppCard>
      </div>

      {/* Campaign status + referrals */}
      <div className="grid gap-6 lg:grid-cols-5">
        <WebAppCard className="lg:col-span-3" title="Campaign Status" description="Campaigns by status.">
          {statusTotal === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No campaigns {period}.</p>
          ) : (
            <>
              <div className="flex h-2 overflow-hidden rounded-full">
                {data.campaignStatus.map((item) => (
                  <div
                    key={item.status}
                    className={statusColors[item.status.toLowerCase()] ?? "bg-gray-400"}
                    style={{ width: `${(item.count / statusTotal) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {data.campaignStatus.map((item) => (
                  <div key={item.status} className="flex gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        statusColors[item.status.toLowerCase()] ?? "bg-gray-400",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{humanizeType(item.status)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </WebAppCard>

        <WebAppCard className="lg:col-span-2" title="Referral Statistics" description="Referral performance snapshot.">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: "Total Referrals", value: referrals.total.toLocaleString() },
              { label: "Successful Referrals", value: referrals.successful.toLocaleString() },
              { label: "Pending", value: referrals.pending.toLocaleString() },
              { label: "Bonus Credits Issued", value: formatNaira(referrals.bonusPaid) },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <Link
            to="/referrals"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View Referral Management <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </WebAppCard>
      </div>

      {/* Recent activities */}
      <WebAppCard title="Recent Activities" description="The latest activity across the platform.">
        {data.recentActivities.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.recentActivities.map((activity) => {
              const { icon: Icon, tone } = activityStyle(activity.type);
              const createdAt = parseApiDate(activity.createdAt);
              return (
                <li key={activity.id} className="flex items-start gap-3 py-3">
                  <span className={cn("rounded-md p-2", toneStyles[tone].icon)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.userName && <span className="font-medium">{activity.userName} · </span>}
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                  <time
                    dateTime={createdAt.toISOString()}
                    title={formatDateTimeShort(createdAt)}
                    className="shrink-0 text-xs text-gray-500"
                  >
                    {formatRelativeTime(createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </WebAppCard>
    </>
  );
};

export const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeParam = searchParams.get("range");
  const range = dateRanges.find((option) => option.value === rangeParam) ?? dateRanges.find((option) => option.value === DEFAULT_RANGE)!;
  const { data, error: apiError, loading, refresh } = useDashboardSummary(range.value);
  const error = apiError ? apiError.message || "We couldn't load the dashboard." : null;

  const setRange = (value: string) =>
    setSearchParams(value === DEFAULT_RANGE ? {} : { range: value }, { replace: true });

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Dashboard Overview"
        description="Monitor platform activity, campaigns, users and revenue."
        actions={
          <div className="flex items-center gap-2">
            <WebAppSelectInput
              size="sm"
              fullWidth={false}
              containerClassName="w-40"
              leftIcon={<Calendar className="h-4 w-4" />}
              options={dateRanges}
              value={range.value}
              onChange={setRange}
            />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh dashboard"
              title="Refresh"
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        }
      />

      {error && data && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error} Showing the last loaded figures.</span>
          <button type="button" onClick={refresh} className="inline-flex items-center gap-1 font-medium hover:underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {data ? (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
          <DashboardContent data={data} period={range.period} />
        </div>
      ) : error ? (
        <WebAppEmptyState
          icon={<CircleAlert className="h-6 w-6" />}
          title="Couldn't load the dashboard"
          description={error}
          primaryAction={{ label: "Try again", onClick: refresh }}
        />
      ) : (
        <StatsSkeleton />
      )}
    </div>
  );
};
