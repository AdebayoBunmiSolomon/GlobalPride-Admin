import type { ReactNode } from "react";
import { FileText, Flag, History, Megaphone, ScrollText, ShieldCheck } from "lucide-react";

import { WebAppBadge } from "@/components/Badge";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppTabs } from "@/components/Tabs";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { CampaignComplianceStatus, FlagSeverity, FlagSource, FlagStatus } from "@/api/types/response";
import {
  backToCompliance,
  campaignComplianceStyles,
  flagSeverityStyles,
  flagSources,
  flagStatusStyles,
} from "./complianceOptions";

const StyledBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);

export const FlagStatusBadge = ({ status }: { status: FlagStatus }) => <StyledBadge style={flagStatusStyles[status]} />;

export const FlagSeverityBadge = ({ severity }: { severity: FlagSeverity }) => (
  <StyledBadge style={flagSeverityStyles[severity]} />
);

export const CampaignComplianceBadge = ({ status }: { status: CampaignComplianceStatus }) => (
  <StyledBadge style={campaignComplianceStyles[status]} />
);

export const FlagSourceLabel = ({ source }: { source: FlagSource }) => {
  const { label, icon: Icon } = flagSources[source];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-700">
      <Icon className="h-4 w-4 text-gray-500" />
      {label}
    </span>
  );
};

const tabs = [
  { label: "Flagged Activities", to: "/compliance", icon: Flag, end: true },
  { label: "Content Reports", to: "/compliance/content-reports", icon: FileText },
  { label: "Campaign Compliance", to: "/compliance/campaigns", icon: Megaphone },
  { label: "User Activity Logs", to: "/compliance/user-activity", icon: History },
  { label: "Audit Logs", to: "/compliance/audit-logs", icon: ScrollText },
  { label: "Disclaimer Logs", to: "/compliance/disclaimers", icon: ShieldCheck },
];

interface CompliancePageHeaderProps {
  title: string;
  description: string;
  /** Breadcrumb label for a sub-section; omit on the Compliance landing tab. */
  section?: string;
  /** e.g. a refresh button. */
  actions?: ReactNode;
}

/** Page header + section tabs shared by every compliance tab. */
export const CompliancePageHeader = ({ title, description, section, actions }: CompliancePageHeaderProps): ReactNode => (
  <div>
    <WebAppPageHeader
      title={title}
      description={description}
      breadcrumbs={
        section
          ? [{ label: "Dashboard", to: "/dashboard" }, { label: "Compliance", to: "/compliance" }, { label: section }]
          : [{ label: "Dashboard", to: "/dashboard" }, { label: "Compliance" }]
      }
      backLink={section ? backToCompliance : undefined}
      actions={actions}
    />
    <div className="-mt-2">
      <WebAppTabs label="Compliance sections" tabs={tabs} />
    </div>
  </div>
);
