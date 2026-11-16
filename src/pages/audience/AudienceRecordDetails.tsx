import { useNavigate, useParams } from "react-router-dom";
import { CircleAlert, User, UserX } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useAudienceRecord } from "@/store/audienceStore";
import { formatDateTime, parseApiDate } from "@/utils/format";
import { genderLabels } from "./audienceOptions";
import { RefreshButton } from "./audienceShared";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Audience Marketplace", to: "/audience-marketplace" },
  { label: "Audience Record" },
];

const backLink = { label: "Back to Audience Marketplace", to: "/audience-marketplace" };

export const AudienceRecordDetails = () => {
  const { recordId = "" } = useParams();
  const navigate = useNavigate();
  const { data: record, error, loading, refresh } = useAudienceRecord(recordId);

  if (!record) {
    const notFound = error?.status === 404 || error?.status === 400;
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={notFound ? <UserX className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
              title={notFound ? "Audience record not found" : "Couldn't load this record"}
              description={notFound ? "This record may have been removed, or the link is incorrect." : error.message}
              primaryAction={
                notFound
                  ? { label: "Back to Audience Marketplace", onClick: () => navigate("/audience-marketplace") }
                  : { label: "Try again", onClick: refresh }
              }
            />
          </WebAppCard>
        ) : (
          <div className="space-y-4" aria-busy={loading} aria-label="Loading record">
            <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-72 animate-pulse rounded-xl bg-gray-100" />
          </div>
        )}
      </div>
    );
  }

  const name = [record.firstName, record.lastName].filter(Boolean).join(" ") || "Unnamed contact";
  const location = [record.lga, record.state].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backLink} />

      <WebAppCard bodyClassName="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">
              {record.phoneNumber}
              {location && ` · ${location}`}
            </p>
          </div>
        </div>
        <RefreshButton onClick={refresh} loading={loading} label="Refresh record" />
      </WebAppCard>

      <WebAppCard title="Record Information">
        <WebAppDetailList
          align="right"
          className="-my-3"
          items={[
            { label: "Record ID", value: record.id },
            { label: "Phone Number", value: record.phoneNumber },
            { label: "First Name", value: record.firstName ?? "—" },
            { label: "Last Name", value: record.lastName ?? "—" },
            { label: "State", value: record.state ?? "—" },
            { label: "LGA", value: record.lga ?? "—" },
            { label: "Gender", value: genderLabels[record.gender] },
            { label: "Added", value: record.createdAt ? formatDateTime(parseApiDate(record.createdAt)) : "—" },
          ]}
        />
      </WebAppCard>
    </div>
  );
};
