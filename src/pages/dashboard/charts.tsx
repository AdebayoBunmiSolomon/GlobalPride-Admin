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

const axisTick = { fontSize: 11, fill: "#6b7280" };
const toThousands = (value: number) => (value === 0 ? "0k" : `${value / 1000}k`);

interface CampaignPerformanceChartProps {
  data: { day: string; campaigns: number; messages: number }[];
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceChartProps) => (
  <div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
          <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis yAxisId="campaigns" tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="messages"
            orientation="right"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={toThousands}
          />
          <Tooltip />
          <Bar
            yAxisId="campaigns"
            dataKey="campaigns"
            name="Campaigns Created"
            fill="var(--color-primary)"
            barSize={12}
          />
          <Line
            yAxisId="messages"
            dataKey="messages"
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
  data: { day: string; revenue: number }[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => (
  <div className="h-36">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" hide />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `₦${toThousands(value)}`}
        />
        <Tooltip />
        <Area
          dataKey="revenue"
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
