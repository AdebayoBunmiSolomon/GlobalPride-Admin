import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { mockCampaigns } from "@/data/mock";
import { useCompliance } from "@/hooks/useCompliance";
import { formatDateOnly, formatDateTimeShort } from "@/utils/format";
import { CampaignComplianceBadge, CompliancePageHeader } from "./ComplianceParts";
import { campaignComplianceFilterOptions, campaignComplianceRank, getCampaignCompliance } from "./complianceOptions";

const PAGE_SIZE = 10;

const linkClass = "font-medium text-primary hover:underline";

export const CampaignCompliance = () => {
  const flags = useCompliance((state) => state.flags);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const records = useMemo(
    () => mockCampaigns.map((campaign) => ({ campaign, ...getCampaignCompliance(campaign, flags) })),
    [flags],
  );

  // TODO: move search / filters / paging to the API once the compliance endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter(
        (record) =>
          (status === "all" || record.status === status) &&
          (!query ||
            [record.campaign.id, record.campaign.name, record.campaign.userName].some((value) =>
              value.toLowerCase().includes(query),
            )),
      )
      .sort(
        (a, b) =>
          campaignComplianceRank[a.status] - campaignComplianceRank[b.status] ||
          (b.lastReviewed ?? b.campaign.createdAt).localeCompare(a.lastReviewed ?? a.campaign.createdAt),
      );
  }, [records, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CompliancePageHeader
        title="Campaign Compliance"
        description="Compliance checks and outcomes associated with campaigns."
        section="Campaign Compliance"
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
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="campaignComplianceStatus"
            options={campaignComplianceFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
        </div>

        {pageRecords.length === 0 ? (
          <WebAppEmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title="No campaigns found"
            description="Try a different search term or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Campaign</th>
                  <th scope="col" className="px-5 py-3 font-semibold">User</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Compliance Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Flag Count</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Reviewed</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRecords.map(({ campaign, status: complianceStatus, flagCount, lastReviewed }) => (
                  <tr key={campaign.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.id}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Link to={`/users/${campaign.userId}`} className={linkClass}>
                        {campaign.userName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <CampaignComplianceBadge status={complianceStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{flagCount}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                      {/* Unflagged campaigns were checked automatically when created. */}
                      {lastReviewed ? formatDateTimeShort(lastReviewed) : formatDateOnly(campaign.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/campaigns/${campaign.id}`} className={linkClass}>
                        View
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
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel="records"
          />
        )}
      </WebAppCard>
    </div>
  );
};
