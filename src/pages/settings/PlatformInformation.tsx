import { CircleAlert, MessageSquareText } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { useSmsBalance, useSystemInfo } from "@/store/settingsStore";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { SettingsLayout } from "./SettingsLayout";

/** "platformVersion" / "database_status" → "Platform Version" / "Database Status". */
const toLabel = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bApi\b/g, "API")
    .replace(/\bUtc\b/g, "UTC")
    .replace(/\bSms\b/g, "SMS");

/** ISO date-times are shown as local dates; everything else as sent. */
const toValue = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? formatDateTimeShort(parseApiDate(value)) : value;

const Skeleton = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading">
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="h-6 animate-pulse rounded bg-gray-100" />
    ))}
  </div>
);

export const PlatformInformation = () => {
  const systemInfo = useSystemInfo();
  const smsBalance = useSmsBalance();
  const balance = smsBalance.data;

  return (
    <SettingsLayout
      title="Platform Information"
      description="View Global Pride platform and system information."
      section="Platform Information"
    >
      <WebAppCard
        divided
        title="SMS Gateway Balance"
        description="Remaining SMS units on the EBulkSMS reseller account. Top up before it runs out, or SMS campaigns fail with insufficient credit."
        action={<RefreshButton label="Refresh SMS balance" loading={smsBalance.loading} onClick={() => void smsBalance.refresh()} />}
      >
        {balance ? (
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </span>
            {balance.available ? (
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {balance.balance === null ? "—" : balance.balance.toLocaleString()}
                  <span className="ml-1.5 text-sm font-medium text-gray-500">units</span>
                </p>
                {balance.message && <p className="text-xs text-gray-500">{balance.message}</p>}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-amber-700">
                <CircleAlert className="h-4 w-4 shrink-0" />
                Balance unavailable{balance.message ? `: ${balance.message}` : "."}
              </p>
            )}
          </div>
        ) : smsBalance.error ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't check the SMS balance: {smsBalance.error.message}
          </p>
        ) : (
          <Skeleton />
        )}
      </WebAppCard>

      <WebAppCard
        divided
        title="System Information"
        description="Read-only information about the deployed platform."
        action={<RefreshButton label="Refresh system information" loading={systemInfo.loading} onClick={() => void systemInfo.refresh()} />}
      >
        {systemInfo.data ? (
          systemInfo.data.length > 0 ? (
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={systemInfo.data.map(({ key, value }) => ({ label: toLabel(key), value: toValue(value) }))}
            />
          ) : (
            <p className="text-sm text-gray-500">The API returned no system information.</p>
          )
        ) : systemInfo.error ? (
          <WebAppEmptyState
            icon={<CircleAlert className="h-6 w-6" />}
            title="Couldn't load the system information"
            description={systemInfo.error.message}
            primaryAction={{ label: "Try again", onClick: () => void systemInfo.refresh() }}
          />
        ) : (
          <Skeleton />
        )}
      </WebAppCard>
    </SettingsLayout>
  );
};
