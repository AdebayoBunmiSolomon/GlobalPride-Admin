import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Info, RefreshCw } from "lucide-react";

import type { AdminCampaignDetails, ApiError, CampaignDeliveryReport } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { downloadDeliveryReport, refreshDeliveryReport, useDeliveryReport } from "@/store/campaignsStore";
import { appToast } from "@/utils/appToast";
import { cn } from "@/utils/cn";
import { formatDateTimeShort, formatRelativeTime, parseApiDate } from "@/utils/format";

const segmentColors: Record<string, string> = {
  delivered: "bg-green-500",
  pending: "bg-blue-400",
  unconfirmed: "bg-amber-400",
  failed: "bg-red-500",
};

const stateBadges: Record<CampaignDeliveryReport["reportState"], { label: string; variant: "success" | "info" | "neutral" | "warning" }> = {
  final: { label: "Final", variant: "success" },
  awaiting_receipts: { label: "Awaiting receipts", variant: "info" },
  summary_only: { label: "Totals only", variant: "warning" },
  not_applicable: { label: "No delivery data", variant: "neutral" },
};

const Breakdown = ({ report }: { report: CampaignDeliveryReport }) => {
  const total = report.breakdown.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return null;

  return (
    <>
      <div
        role="img"
        aria-label={report.breakdown.map((item) => `${item.count.toLocaleString()} ${item.label}`).join(", ")}
        className="flex h-2 overflow-hidden rounded-full bg-gray-100"
      >
        {report.breakdown.map((item) => (
          <div
            key={item.status}
            className={segmentColors[item.status] ?? "bg-gray-300"}
            style={{ width: `${(item.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600" aria-hidden="true">
        {report.breakdown.map((item) => (
          <span key={item.status} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", segmentColors[item.status] ?? "bg-gray-300")} />
            {item.label} · {item.count.toLocaleString()}
          </span>
        ))}
      </div>
    </>
  );
};

interface DeliveryReportCardProps {
  campaign: AdminCampaignDetails;
}

export const DeliveryReportCard = ({ campaign }: DeliveryReportCardProps) => {
  const { data: report, error, loading, refresh } = useDeliveryReport(campaign.id);
  const [busy, setBusy] = useState<"refresh" | "export" | null>(null);

  const handleGatewayRefresh = async () => {
    setBusy("refresh");
    try {
      await refreshDeliveryReport(campaign.id);
      appToast.show("Delivery report updated", "Fetched the latest receipts from the SMS gateway.", "success");
    } catch (reason) {
      // The gateway refresh is rate-limited; the API explains when to try again.
      const apiError = reason as ApiError;
      handleApiError(reason, {
        fallbackMessage: apiError.status === 429 ? "Please wait a moment before refreshing again." : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setBusy("export");
    try {
      await downloadDeliveryReport(campaign.id);
    } catch (reason) {
      handleApiError(reason, { fallbackMessage: "We couldn't download the delivery report." });
    } finally {
      setBusy(null);
    }
  };

  if (!report) {
    return (
      <WebAppCard title="Delivery Report">
        {error ? (
          <div className="text-sm text-gray-600">
            <p>{error.message}</p>
            <button type="button" onClick={refresh} className="mt-2 font-medium text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="h-32 animate-pulse rounded-lg bg-gray-50" aria-busy={loading} aria-label="Loading delivery report" />
        )}
      </WebAppCard>
    );
  }

  const state = stateBadges[report.reportState] ?? stateBadges.not_applicable;
  const hasFigures = report.reportState !== "not_applicable";
  const canRefreshFromGateway = report.reportState === "awaiting_receipts" || report.reportState === "final";

  return (
    <WebAppCard
      title="Delivery Report"
      action={<WebAppBadge variant={state.variant}>{state.label}</WebAppBadge>}
    >
      {hasFigures && <Breakdown report={report} />}

      {hasFigures && (
        <WebAppDetailList
          align="right"
          className="mt-2"
          items={[
            { label: "Recipients", value: report.recipientCount.toLocaleString() },
            ...(report.acceptedCount != null
              ? [{ label: "Accepted by Gateway", value: report.acceptedCount.toLocaleString() }]
              : []),
            ...(report.deliveredCount != null ? [{ label: "Delivered", value: report.deliveredCount.toLocaleString() }] : []),
            { label: "Failed", value: report.failedCount.toLocaleString() },
            ...(report.pendingCount > 0 ? [{ label: "Awaiting Receipt", value: report.pendingCount.toLocaleString() }] : []),
            ...(report.unconfirmedCount > 0
              ? [{ label: "No Receipt", value: report.unconfirmedCount.toLocaleString() }]
              : []),
            ...(report.deliveryRatePercent != null
              ? [{ label: "Delivery Rate", value: `${report.deliveryRatePercent}%` }]
              : []),
            ...(report.unitsUsed != null ? [{ label: "SMS Units Used", value: report.unitsUsed.toLocaleString() }] : []),
            ...(report.imageLinkOpenCount != null
              ? [{ label: "Image Link Opens", value: report.imageLinkOpenCount.toLocaleString() }]
              : []),
          ]}
        />
      )}

      {report.failureReasons.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-700">Failure reasons</p>
          <ul className="mt-2 space-y-1.5">
            {report.failureReasons.map((item) => (
              <li key={item.reason} className="flex justify-between gap-3 text-sm">
                <span className="text-gray-700">{item.reason}</span>
                <span className="font-medium text-red-600">{item.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.note && (
        <p className="mt-4 flex gap-2 rounded-lg bg-stone-50 px-4 py-3 text-sm text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          {report.note}
        </p>
      )}

      {report.lastUpdatedAt && (
        <p className="mt-3 text-xs text-gray-500" title={formatDateTimeShort(parseApiDate(report.lastUpdatedAt))}>
          Last receipt {formatRelativeTime(parseApiDate(report.lastUpdatedAt))}
        </p>
      )}

      {(canRefreshFromGateway || report.hasRecipientDetail) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          {canRefreshFromGateway && (
            <WebAppButton
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={busy === "refresh"}
              disabled={busy !== null}
              onClick={handleGatewayRefresh}
            >
              Check for new receipts
            </WebAppButton>
          )}
          {report.hasRecipientDetail && (
            <>
              <WebAppButton
                size="sm"
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                loading={busy === "export"}
                disabled={busy !== null}
                onClick={handleExport}
              >
                Export CSV
              </WebAppButton>
              <Link
                to={`/campaigns/${campaign.id}/recipients?view=delivery`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Delivery per recipient <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      )}
    </WebAppCard>
  );
};
