import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardSummary } from "@/api/types/response";
import { formatPrice, formatShortDay } from "@/utils/format";

const axisTick = { fontSize: 11, fill: "#6b7280" };
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const formatCompact = (value: number) => compact.format(value);

interface CampaignPerformanceChartProps {
  data: DashboardSummary["campaignPerformance"];
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceChartProps) => (
  <div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={formatShortDay}
            minTickGap={16}
          />
          <YAxis yAxisId="campaigns" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            yAxisId="messages"
            orientation="right"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={formatCompact}
          />
          <Tooltip labelFormatter={(label) => formatShortDay(String(label))} />
          <Bar
            yAxisId="campaigns"
            dataKey="campaignsCreated"
            name="Campaigns Created"
            fill="var(--color-primary)"
            maxBarSize={12}
          />
          <Line
            yAxisId="messages"
            dataKey="messagesSent"
            name="Messages Sent"
            type="monotone"
            stroke="#111827"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-3 flex items-center gap-5 text-xs text-gray-700">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Campaigns Created
      </span>
      <span className="flex items-center gap-2">
        <span className="h-3 w-0.5 bg-gray-900" /> Messages Sent
      </span>
    </div>
  </div>
);

interface RevenueChartProps {
  /** Per-day totals, e.g. the dashboard's `revenueOverview` or the finance summary's series. */
  data: { date: string; total: number }[];
  /** Height, e.g. "h-56". */
  className?: string;
}

export const RevenueChart = ({ data, className = "h-36" }: RevenueChartProps) => (
  <div className={className}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `₦${formatCompact(value)}`}
        />
        <Tooltip
          labelFormatter={(label) => formatShortDay(String(label))}
          formatter={(value) => formatPrice(Number(value), { fixed: true })}
        />
        <Area
          dataKey="total"
          name="Revenue"
          type="monotone"
          stroke="var(--color-primary)"
          strokeWidth={1.5}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
