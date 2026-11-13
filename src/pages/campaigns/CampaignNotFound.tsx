import { useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";

interface CampaignNotFoundProps {
  breadcrumbs: { label: string; to?: string }[];
}

export const CampaignNotFound = ({ breadcrumbs }: CampaignNotFoundProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <WebAppPageHeader
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to Campaigns", to: "/campaigns" }}
      />
      <WebAppCard>
        <WebAppEmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Campaign not found"
          description="This campaign may have been removed, or the link is incorrect."
          primaryAction={{ label: "Back to Campaigns", onClick: () => navigate("/campaigns") }}
        />
      </WebAppCard>
    </div>
  );
};
