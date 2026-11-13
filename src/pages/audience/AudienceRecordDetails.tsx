import { useNavigate, useParams } from "react-router-dom";
import { User, UserX } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { getRecordStatus, useAudience } from "@/hooks/useAudience";
import { LocationStatusBadge } from "./LocationStatus";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Audience Marketplace", to: "/audience-marketplace" },
  { label: "Audience Record" },
];

const backLink = { label: "Back to Audience Marketplace", to: "/audience-marketplace" };

export const AudienceRecordDetails = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { states, lgas, records } = useAudience();
  const record = records.find((item) => item.id === recordId);

  if (!record) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="Audience record not found"
            description="This record may have been removed, or the link is incorrect."
            primaryAction={{ label: "Back to Audience Marketplace", onClick: () => navigate("/audience-marketplace") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const stateName = states.find((state) => state.id === record.stateId)?.name ?? "—";
  const lgaName = lgas.find((lga) => lga.id === record.lgaId)?.name ?? "—";
  const status = getRecordStatus(record, states, lgas);

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />

      <WebAppCard bodyClassName="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">
              {record.firstName} {record.lastName}
            </h1>
            <p className="text-sm text-gray-600">
              {record.phone} · {stateName}
            </p>
          </div>
        </div>
        <LocationStatusBadge status={status} />
      </WebAppCard>

      <WebAppCard title="Record Information">
        <WebAppDetailList
          align="right"
          className="-my-3"
          items={[
            { label: "Phone Number", value: record.phone },
            { label: "First Name", value: record.firstName },
            { label: "Last Name", value: record.lastName },
            { label: "State", value: stateName },
            { label: "LGA", value: lgaName },
            { label: "Gender", value: record.gender === "male" ? "Male" : "Female" },
            { label: "Status", value: status === "active" ? "Active" : "Inactive" },
          ]}
        />
      </WebAppCard>
    </div>
  );
};
