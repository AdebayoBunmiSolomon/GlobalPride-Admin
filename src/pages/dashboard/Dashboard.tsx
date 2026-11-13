import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, Calendar } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppCard } from "@/components/Card";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import {
  attentionItems,
  campaignPerformance,
  campaignStatus,
  recentActivities,
  referralStats,
  revenueSources,
  revenueTrend,
  statCards,
} from "@/data/mock";
import { cn } from "@/utils/cn";
import { toneStyles } from "@/utils/tones";
import { CampaignPerformanceChart, RevenueChart } from "./charts";

const dateRanges = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
];

const chartRanges = ["7", "30", "90"];

const statusTotal = campaignStatus.reduce((sum, item) => sum + item.count, 0);

export const Dashboard = () => {
  const [dateRange, setDateRange] = useState("30");
  const [chartRange, setChartRange] = useState("30");

  // Mock data only covers ~30 days; the 7-day view shows the latest points.
  const performanceData =
    chartRange === "7" ? campaignPerformance.slice(-7) : campaignPerformance;

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Dashboard Overview"
        description="Monitor platform activity, campaigns, users and revenue."
        actions={
          <WebAppSelectInput
            size="sm"
            fullWidth={false}
            containerClassName="w-40"
            leftIcon={<Calendar className="h-4 w-4" />}
            options={dateRanges}
            value={dateRange}
            onChange={setDateRange}
          />
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border p-4",
              "highlighted" in stat
                ? "border-primary/30 bg-primary/5"
                : "border-gray-200 bg-white",
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-700">{stat.label}</p>
              <span className={cn("rounded-md p-1.5", toneStyles[stat.tone].icon)}>
                <stat.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">
              {"trend" in stat ? (
                <>
                  <span className="inline-flex items-center gap-0.5 font-medium text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    {stat.trend}
                  </span>{" "}
                  vs. previous period
                </>
              ) : (
                stat.note
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Requires attention */}
      <WebAppCard
        title="Requires Attention"
        description="Items that may require admin review or action."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {attentionItems.map((item) => {
            const tone = toneStyles[item.tone];
            return (
              <div
                key={item.title}
                className={cn(
                  "flex flex-col rounded-lg border p-3",
                  item.tone === "purple"
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-200 bg-stone-50",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className={cn("rounded-md p-1.5", tone.icon)}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  {"count" in item && (
                    <span className={cn("text-lg font-bold", tone.text)}>
                      {item.count}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 flex-1 text-xs text-gray-500">{item.description}</p>
                <button
                  type="button"
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline",
                    tone.text,
                  )}
                >
                  {item.action}
                  <ArrowRight className="h-3 w-3" />
                </button>
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
          description="Campaign activity and message volume over time."
          action={
            <div className="flex shrink-0 rounded-full bg-gray-100 p-1 text-xs">
              {chartRanges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setChartRange(range)}
                  className={cn(
                    "rounded-full px-3 py-1",
                    chartRange === range
                      ? "bg-white font-medium text-gray-900 shadow-sm"
                      : "text-gray-500",
                  )}
                >
                  {range} days
                </button>
              ))}
            </div>
          }
        >
          <CampaignPerformanceChart data={performanceData} />
        </WebAppCard>

        <WebAppCard
          className="lg:col-span-2"
          title="Revenue Overview"
          description="Revenue trend across platform sources."
        >
          <p className="text-2xl font-bold text-gray-900">₦18.4M</p>
          <p className="text-xs text-gray-500">Total Revenue · Last 30 Days</p>
          <RevenueChart data={revenueTrend} />
          <ul className="mt-4 space-y-3">
            {revenueSources.map((source) => (
              <li key={source.label} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2 w-2 rounded-full", source.color)} />
                <span className="flex-1 text-gray-600">{source.label}</span>
                <span className="font-semibold text-gray-900">{source.value}</span>
              </li>
            ))}
          </ul>
        </WebAppCard>
      </div>

      {/* Campaign status + referrals */}
      <div className="grid gap-6 lg:grid-cols-5">
        <WebAppCard
          className="lg:col-span-3"
          title="Campaign Status"
          description="Quick overview of campaign distribution."
        >
          <div className="flex h-2 overflow-hidden rounded-full">
            {campaignStatus.map((item) => (
              <div
                key={item.label}
                className={item.color}
                style={{ width: `${(item.count / statusTotal) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {campaignStatus.map((item) => (
              <div key={item.label} className="flex gap-2">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.color)} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </WebAppCard>

        <WebAppCard
          className="lg:col-span-2"
          title="Referral Statistics"
          description="Referral performance snapshot."
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {referralStats.map((stat) => (
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
      <WebAppCard
        title="Recent Activities"
        action={
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Activity <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <ul className="divide-y divide-gray-100">
          {recentActivities.map((activity) => (
            <li key={activity.text} className="flex items-center gap-3 py-3">
              <span className={cn("rounded-md p-2", toneStyles[activity.tone].icon)}>
                <activity.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">{activity.text}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              {"status" in activity && (
                <WebAppBadge dot variant={activity.status.variant}>
                  {activity.status.label}
                </WebAppBadge>
              )}
            </li>
          ))}
        </ul>
      </WebAppCard>
    </div>
  );
};
