import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { WebAppCard } from "@/components/Card";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { getCampaignRecipients, mockCampaigns } from "@/data/mock";
import { CampaignNotFound } from "./CampaignNotFound";
import { RecipientStatusBadge } from "./StatusBadges";

const PAGE_SIZE = 10;

export const CampaignRecipients = () => {
  const { campaignId } = useParams();
  const [page, setPage] = useState(1);

  // TODO: fetch the recipient list from the API (with page params).
  const campaign = mockCampaigns.find((item) => item.id === campaignId);
  const recipients = useMemo(() => (campaign ? getCampaignRecipients(campaign) : []), [campaign]);

  const breadcrumbs = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Campaign Management", to: "/campaigns" },
    { label: "Campaign Details", to: `/campaigns/${campaignId}` },
    { label: "Recipients" },
  ];

  if (!campaign) return <CampaignNotFound breadcrumbs={breadcrumbs} />;

  const pageRecipients = recipients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <WebAppPageHeader
        title="Recipients"
        description={`Preview recipients for ${campaign.name}.`}
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to Campaign Details", to: `/campaigns/${campaign.id}` }}
      />

      <WebAppCard
        divided
        title="Recipient List"
        description={`${recipients.length.toLocaleString()} recipients`}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Recipient</th>
                <th scope="col" className="px-5 py-3 font-semibold">Phone Number</th>
                <th scope="col" className="px-5 py-3 font-semibold">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRecipients.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{recipient.name}</td>
                  <td className="px-5 py-3.5 text-gray-700">{recipient.phone}</td>
                  <td className="px-5 py-3.5">
                    <RecipientStatusBadge status={recipient.status} />
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
          total={recipients.length}
          onPageChange={setPage}
          itemLabel="recipients"
        />
      </WebAppCard>
    </div>
  );
};
