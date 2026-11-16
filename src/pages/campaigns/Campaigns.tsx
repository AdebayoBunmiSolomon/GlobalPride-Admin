import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, Megaphone, RefreshCw, Search } from "lucide-react";

import type { AdminCampaign } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSortHeader, type SortState } from "@/components/SortHeader";
import { useListParams } from "@/hooks/useListParams";
import { useCampaignList } from "@/store/campaignsStore";
import { cn } from "@/utils/cn";
import { formatDate, parseApiDate } from "@/utils/format";
import { CampaignStatusBadge } from "./StatusBadges";

const PAGE_SIZE = 20;

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sending", value: "sending" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "SMS", value: "sms" },
  { label: "Image", value: "image" },
  { label: "Audio", value: "audio" },
  { label: "Video", value: "video" },
];

type SortKey = "name" | "recipients" | "createdAt";
const sortKeys: SortKey[] = ["name", "recipients", "createdAt"];

const compareCampaigns = (a: AdminCampaign, b: AdminCampaign, key: SortKey) => {
  if (key === "recipients") return a.recipients - b.recipients;
  if (key === "createdAt") return a.createdAt.localeCompare(b.createdAt);
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

/** "2 / 2 delivered", "1 failed" — or a dash when the campaign has no delivery figures. */
const DeliveryCell = ({ campaign }: { campaign: AdminCampaign }) => {
  const { delivery } = campaign;
  if (!delivery.tracked || campaign.recipients === 0) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-xs text-gray-600">
      <span className="font-medium text-green-700">{delivery.delivered.toLocaleString()}</span> delivered
      {delivery.failed > 0 && (
        <>
          {" · "}
          <span className="font-medium text-red-600">{delivery.failed.toLocaleString()}</span> failed
        </>
      )}
      {delivery.pending + delivery.unconfirmed > 0 && ` · ${(delivery.pending + delivery.unconfirmed).toLocaleString()} awaiting`}
    </span>
  );
};

export const Campaigns = () => {
  // Filters live in the URL so "Back to Campaigns" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({ status: "all", type: "all", page: "1" });
  const search = get("q");
  const status = statusOptions.find((option) => option.value === get("status"))?.value ?? "all";
  const type = typeOptions.find((option) => option.value === get("type"))?.value ?? "all";
  const sortKey = sortKeys.find((key) => key === get("sort")) ?? "createdAt";
  const sort: SortState<SortKey> = {
    key: sortKey,
    direction: get("dir") === "asc" ? "asc" : get("dir") === "desc" ? "desc" : sortKey === "name" ? "asc" : "desc",
  };

  // Fetched once and cached (see src/store); everything below runs in the browser.
  const { data: allCampaigns, error, loading, fetchedAt, refresh } = useCampaignList();

  const campaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (allCampaigns ?? [])
      .filter((campaign) => status === "all" || campaign.status === status)
      .filter((campaign) => type === "all" || campaign.type.toLowerCase() === type)
      .filter(
        (campaign) =>
          !query ||
          [campaign.name, campaign.id, campaign.userName, campaign.sender].some((field) =>
            field?.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => {
        const result = compareCampaigns(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [allCampaigns, search, status, type, sort.key, sort.direction]);

  const pageCount = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageCampaigns = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) =>
    update({
      sort: key,
      dir: sort.key === key ? (sort.direction === "asc" ? "desc" : "asc") : key === "name" ? "asc" : "desc",
      page: null,
    });

  const total = allCampaigns?.length ?? 0;
  const description = !allCampaigns
    ? "Loading campaigns…"
    : campaigns.length === total
      ? `${total.toLocaleString()} ${total === 1 ? "campaign" : "campaigns"}`
      : `${campaigns.length.toLocaleString()} of ${total.toLocaleString()} campaigns`;

  return (
    <div>
      <WebAppPageHeader
        title="Campaign Management"
        description="View and monitor platform campaigns."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Campaign Management" }]}
      />

      <WebAppCard
        divided
        title="Campaigns"
        description={description}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <WebAppInput
              id="campaignSearch"
              type="search"
              placeholder="Search name, reference or user..."
              aria-label="Search campaigns"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => update({ q: event.target.value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-72"
            />
            <WebAppSelectInput
              id="campaignStatus"
              aria-label="Status"
              options={statusOptions}
              value={status}
              onChange={(value) => update({ status: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
            <WebAppSelectInput
              id="campaignType"
              aria-label="Type"
              options={typeOptions}
              value={type}
              onChange={(value) => update({ type: value, page: null })}
              fullWidth={false}
              containerClassName="w-full sm:w-36"
            />
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh campaigns"
              title={fetchedAt ? `Last updated ${new Date(fetchedAt).toLocaleTimeString()}` : "Refresh"}
              className="rounded-lg border border-gray-200 px-3 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        }
      >
        {error && !allCampaigns ? (
          <WebAppEmptyState
            icon={<CircleAlert className="h-6 w-6" />}
            title="Couldn't load campaigns"
            description={error.message}
            primaryAction={{ label: "Try again", onClick: refresh }}
          />
        ) : !allCampaigns ? (
          <div className="space-y-px" aria-busy="true" aria-label="Loading campaigns">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : pageCampaigns.length === 0 ? (
          <WebAppEmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="No campaigns found"
            description={
              search || status !== "all" || type !== "all"
                ? "Try a different search term, status or type."
                : "No campaigns have been created yet."
            }
          />
        ) : (
          <>
            {error && (
              <div role="alert" className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-2.5 text-sm text-red-700">
                <CircleAlert className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error.message} Showing the last loaded campaigns.</span>
                <button type="button" onClick={refresh} className="font-medium hover:underline">
                  Retry
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 text-left text-sm">
                <thead className="border-b border-gray-200 text-xs text-gray-600">
                  <tr>
                    <WebAppSortHeader label="Campaign" sortKey="name" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">User</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                    <WebAppSortHeader label="Recipients" sortKey="recipients" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Delivery</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <WebAppSortHeader label="Created" sortKey="createdAt" sort={sort} onSort={handleSort} />
                    <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500">{campaign.id}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link to={`/users/${campaign.userId}`} className="text-gray-700 hover:text-primary hover:underline">
                          {campaign.userName}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{campaign.type}</td>
                      <td className="px-5 py-3.5 text-gray-700">{campaign.recipients.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <DeliveryCell campaign={campaign} />
                      </td>
                      <td className="px-5 py-3.5">
                        <CampaignStatusBadge status={campaign.status} />
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{formatDate(parseApiDate(campaign.createdAt))}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/campaigns/${campaign.id}`} className="font-medium text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <WebAppPagination
              className="border-t border-gray-200 px-5 py-4"
              page={page}
              pageSize={PAGE_SIZE}
              total={campaigns.length}
              onPageChange={(next) => update({ page: next })}
              itemLabel="campaigns"
            />
          </>
        )}
      </WebAppCard>
    </div>
  );
};
