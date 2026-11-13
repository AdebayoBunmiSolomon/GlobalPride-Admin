import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppSortHeader, type SortState } from "@/components/SortHeader";
import { mockCampaigns } from "@/data/mock";
import type { Campaign } from "@/types/campaign";
import { formatDate } from "@/utils/format";
import { CampaignStatusBadge } from "./StatusBadges";

const PAGE_SIZE = 10;

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "SMS", value: "SMS" },
  { label: "Image", value: "Image" },
];

type SortKey = "name" | "recipients" | "createdAt";

const compareCampaigns = (a: Campaign, b: Campaign, key: SortKey) => {
  if (key === "recipients") return a.recipients - b.recipients;
  if (key === "createdAt") return a.createdAt.localeCompare(b.createdAt);
  return a.name.localeCompare(b.name);
};

export const Campaigns = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);

  // TODO: move search / filter / sort / paging to the API once the campaigns endpoint exists.
  const campaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockCampaigns
      .filter((campaign) => status === "all" || campaign.status === status)
      .filter((campaign) => type === "all" || campaign.type === type)
      .filter(
        (campaign) =>
          !query ||
          [campaign.name, campaign.id, campaign.userName].some((field) =>
            field.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => {
        const result = compareCampaigns(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [search, status, type, sort]);

  const pageCount = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageCampaigns = campaigns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "name" ? "asc" : "desc" },
    );
    setPage(1);
  };

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
        description={`${campaigns.length.toLocaleString()} ${campaigns.length === 1 ? "campaign" : "campaigns"}`}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <WebAppInput
              id="campaignSearch"
              type="search"
              placeholder="Search campaigns..."
              aria-label="Search campaigns"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-72"
            />
            <WebAppSelectInput
              id="campaignStatus"
              options={statusOptions}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-40"
            />
            <WebAppSelectInput
              id="campaignType"
              options={typeOptions}
              value={type}
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-36"
            />
          </div>
        }
      >
        {pageCampaigns.length === 0 ? (
          <WebAppEmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="No campaigns found"
            description="Try a different search term, status or type."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <WebAppSortHeader label="Campaign" sortKey="name" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <WebAppSortHeader
                    label="Recipients"
                    sortKey="recipients"
                    sort={sort}
                    onSort={handleSort}
                  />
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
                    <td className="px-5 py-3.5 text-gray-700">{campaign.userName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{campaign.type}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {campaign.recipients.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDate(campaign.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {campaigns.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={campaigns.length}
            onPageChange={setPage}
            itemLabel="campaigns"
          />
        )}
      </WebAppCard>
    </div>
  );
};
