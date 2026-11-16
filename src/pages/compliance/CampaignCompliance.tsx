import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, Megaphone, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useListParams } from "@/hooks/useListParams";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { ListLoadState } from "@/pages/support/SupportParts";
import { useFlaggedCampaigns } from "@/store/complianceStore";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { CampaignComplianceBadge, CompliancePageHeader } from "./ComplianceParts";
import { campaignComplianceFilterOptions, campaignComplianceRank } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

const when = (value: string | null) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

export const CampaignCompliance = () => {
  const { get, update, page: requestedPage } = useListParams({ status: "all", page: "1" });
  const search = get("q");
  const status = get("status");
  // Every flagged campaign is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: campaigns, error, loading, refresh } = useFlaggedCampaigns();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (campaigns ?? [])
      .filter(
        (campaign) =>
          (status === "all" || (status === "open" ? campaign.openFlagCount > 0 : campaign.status === status)) &&
          (!query ||
            [campaign.id, campaign.name, campaign.userName].some((value) => value.toLowerCase().includes(query))),
      )
      .sort(
        (a, b) =>
          campaignComplianceRank[a.status] - campaignComplianceRank[b.status] ||
          (b.lastFlaggedAt ?? "").localeCompare(a.lastFlaggedAt ?? ""),
      );
  }, [campaigns, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = campaigns?.length ?? 0;

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Campaign Compliance"
        description="Campaigns that have been flagged at least once, and where their reviews stand."
        section="Campaign Compliance"
        actions={<RefreshButton label="Refresh campaign compliance" loading={loading} onClick={() => void refresh()} />}
      />

      <WebAppCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4">
          <WebAppInput
            id="campaignComplianceSearch"
            type="search"
            placeholder="Search campaigns"
            aria-label="Search campaigns"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="campaignComplianceStatus"
            options={campaignComplianceFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-52"
          />
        </div>

        {error && campaigns && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh campaigns: {error.message}
          </p>
        )}

        {!campaigns ? (
          <ListLoadState error={error} hasData={false} what="campaign compliance" onRetry={() => void refresh()} />
        ) : pageRecords.length === 0 ? (
          <WebAppEmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title={total === 0 ? "No flagged campaigns" : "No campaigns found"}
            description={total === 0 ? "Campaigns appear here once they have been flagged." : "Try a different search term or filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Campaign</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Compliance Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Flags (Open)</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Flagged</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Reviewed</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRecords.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.id}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {campaign.userId ? (
                        <Link to={`/users/${encodeURIComponent(campaign.userId)}`} className={linkClass}>
                          {campaign.userName}
                        </Link>
                      ) : (
                        campaign.userName
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <CampaignComplianceBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">
                      {campaign.flagCount}
                      {campaign.openFlagCount > 0 && <span className="text-gray-500"> ({campaign.openFlagCount})</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(campaign.lastFlaggedAt)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{when(campaign.lastReviewedAt)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/campaigns/${encodeURIComponent(campaign.id)}`} className={linkClass}>
                        Campaign
                      </Link>
                      <span className="mx-1.5 text-gray-300">·</span>
                      <Link to={`/compliance?q=${encodeURIComponent(campaign.id)}`} className={linkClass}>
                        Flags
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
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel="campaigns"
          />
        )}
      </WebAppCard>
    </div>
  );
};
