import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CircleAlert, Download, Info, Search, Users } from "lucide-react";

import { handleApiError } from "@/api/utils";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useListParams } from "@/hooks/useListParams";
import {
  downloadDeliveryReport,
  useCampaignDetails,
  useCampaignRecipients,
  useDeliveryRecipients,
  useDeliveryReport,
} from "@/store/campaignsStore";
import { cn } from "@/utils/cn";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { CampaignNotFound } from "./CampaignNotFound";
import { RecipientStatusBadge } from "./StatusBadges";

const PAGE_SIZE = 20;

const deliveryStatusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Awaiting receipt", value: "pending" },
  { label: "No receipt", value: "unconfirmed" },
];

type View = "addressed" | "delivery";

/** Case-insensitive match on name, or on phone digits. */
const matches = (query: string, name: string | null, phone: string | null) => {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  if (name?.toLowerCase().includes(text)) return true;
  const digits = text.replace(/\D/g, "");
  return digits.length >= 3 && Boolean(phone?.replace(/\D/g, "").includes(digits.replace(/^0/, "")));
};

const LoadingRows = () => (
  <div className="space-y-px" aria-busy="true" aria-label="Loading recipients">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="h-14 animate-pulse bg-gray-50" />
    ))}
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <WebAppEmptyState
    icon={<CircleAlert className="h-6 w-6" />}
    title="Couldn't load recipients"
    description={message}
    primaryAction={{ label: "Try again", onClick: onRetry }}
  />
);

const NoteBanner = ({ note }: { note: string }) => (
  <p className="flex gap-2 border-b border-gray-100 bg-stone-50 px-5 py-3 text-sm text-gray-600">
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
    {note}
  </p>
);

const AddressedList = ({ campaignId, search, page, onPage }: { campaignId: string; search: string; page: number; onPage: (page: number) => void }) => {
  const { data, error, refresh } = useCampaignRecipients(campaignId);
  const filtered = useMemo(
    () => (data?.items ?? []).filter((recipient) => matches(search, recipient.name, recipient.phoneNumber)),
    [data, search],
  );

  if (!data) return error ? <ErrorState message={error.message} onRetry={refresh} /> : <LoadingRows />;
  if (data.items.length === 0) {
    return (
      <WebAppEmptyState
        icon={<Users className="h-6 w-6" />}
        title="No recipient list"
        description={data.note || "This campaign has no recipient list."}
      />
    );
  }

  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {data.note && <NoteBanner note={data.note} />}
      {rows.length === 0 ? (
        <WebAppEmptyState icon={<Search className="h-6 w-6" />} title="No matching recipients" description="Try a different name or phone number." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Recipient</th>
                <th scope="col" className="px-5 py-3 font-semibold">Phone Number</th>
                {data.perRecipientStatusAvailable && <th scope="col" className="px-5 py-3 font-semibold">Delivery Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{recipient.name || "Unnamed contact"}</td>
                  <td className="px-5 py-3.5 text-gray-700">{recipient.phoneNumber || "—"}</td>
                  {data.perRecipientStatusAvailable && (
                    <td className="px-5 py-3.5">
                      <RecipientStatusBadge status={recipient.deliveryStatus} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <WebAppPagination
        className="border-t border-gray-200 px-5 py-4"
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={onPage}
        itemLabel="recipients"
      />
    </>
  );
};

const DeliveryList = ({
  campaignId,
  search,
  status,
  page,
  onPage,
}: {
  campaignId: string;
  search: string;
  status: string;
  page: number;
  onPage: (page: number) => void;
}) => {
  const { data, error, refresh } = useDeliveryRecipients(campaignId);
  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter((row) => status === "all" || row.status === status)
        .filter((row) => matches(search, row.name, row.phoneNumber)),
    [data, search, status],
  );

  if (!data) return error ? <ErrorState message={error.message} onRetry={refresh} /> : <LoadingRows />;
  if (data.length === 0) {
    return (
      <WebAppEmptyState
        icon={<Users className="h-6 w-6" />}
        title="No per-recipient delivery data"
        description="This campaign only has delivery totals (see the Delivery Report on the campaign page)."
      />
    );
  }

  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {rows.length === 0 ? (
        <WebAppEmptyState icon={<Search className="h-6 w-6" />} title="No matching recipients" description="Try a different search or status." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-600">
              <tr>
                {["Recipient", "Phone Number", "Channel", "Status", "Detail", "Sent", "Delivered"].map((column) => (
                  <th key={column} scope="col" className="px-5 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{row.name || "Unnamed contact"}</td>
                  <td className="px-5 py-3.5 text-gray-700">{row.phoneNumber || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700">{row.channel || "—"}</td>
                  <td className="px-5 py-3.5">
                    <RecipientStatusBadge status={row.status} label={row.label} />
                  </td>
                  <td className="max-w-64 px-5 py-3.5 text-xs text-gray-600">{row.detail || "—"}</td>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap text-gray-600">
                    {formatDateTimeShort(parseApiDate(row.sentAt))}
                  </td>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap text-gray-600">
                    {row.deliveredAt ? formatDateTimeShort(parseApiDate(row.deliveredAt)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <WebAppPagination
        className="border-t border-gray-200 px-5 py-4"
        page={currentPage}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={onPage}
        itemLabel="recipients"
      />
    </>
  );
};

export const CampaignRecipients = () => {
  const { campaignId = "" } = useParams();
  const { get, update, page } = useListParams({ view: "addressed", status: "all", page: "1" });
  const view: View = get("view") === "delivery" ? "delivery" : "addressed";
  const search = get("q");
  const status = deliveryStatusOptions.find((option) => option.value === get("status"))?.value ?? "all";

  // Usually already cached from Campaign Details (see src/store).
  const campaignQuery = useCampaignDetails(campaignId);
  const report = useDeliveryReport(campaignId).data;
  const [exporting, setExporting] = useState(false);

  const breadcrumbs = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Campaign Management", to: "/campaigns" },
    { label: "Campaign Details", to: `/campaigns/${campaignId}` },
    { label: "Recipients" },
  ];

  if (campaignQuery.error?.status === 404) return <CampaignNotFound breadcrumbs={breadcrumbs} />;

  const campaignName = campaignQuery.data?.name;
  const hasDeliveryDetail = Boolean(report?.hasRecipientDetail);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadDeliveryReport(campaignId);
    } catch (reason) {
      handleApiError(reason, { fallbackMessage: "We couldn't download the delivery report." });
    } finally {
      setExporting(false);
    }
  };

  const views: { value: View; label: string }[] = [
    { value: "addressed", label: "Addressed" },
    { value: "delivery", label: "Delivery Status" },
  ];

  return (
    <div>
      <WebAppPageHeader
        title="Recipients"
        description={campaignName ? `Recipients of ${campaignName}.` : "Recipients of this campaign."}
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to Campaign Details", to: `/campaigns/${campaignId}` }}
      />

      <WebAppCard
        divided
        title={view === "delivery" ? "Delivery per Recipient" : "Recipient List"}
        description={
          view === "delivery"
            ? "Delivery status for each phone number."
            : "Everyone the campaign was addressed to (the user's contacts and groups)."
        }
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <div className="flex shrink-0 rounded-full bg-gray-100 p-1 text-xs" role="group" aria-label="View">
              {views.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={view === option.value}
                  onClick={() => update({ view: option.value, status: null, page: null })}
                  className={cn(
                    "rounded-full px-3 py-1",
                    view === option.value ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <WebAppInput
              id="recipientSearch"
              type="search"
              placeholder="Search name or phone..."
              aria-label="Search recipients"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => update({ q: event.target.value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-60"
            />
            {view === "delivery" && (
              <WebAppSelectInput
                id="deliveryStatus"
                aria-label="Delivery status"
                options={deliveryStatusOptions}
                value={status}
                onChange={(value) => update({ status: value, page: null })}
                fullWidth={false}
                containerClassName="w-full sm:w-44"
              />
            )}
            {view === "delivery" && hasDeliveryDetail && (
              <WebAppButton
                size="sm"
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                loading={exporting}
                onClick={handleExport}
              >
                Export CSV
              </WebAppButton>
            )}
          </div>
        }
      >
        {view === "delivery" ? (
          <DeliveryList campaignId={campaignId} search={search} status={status} page={page} onPage={(next) => update({ page: next })} />
        ) : (
          <AddressedList campaignId={campaignId} search={search} page={page} onPage={(next) => update({ page: next })} />
        )}
      </WebAppCard>
    </div>
  );
};
