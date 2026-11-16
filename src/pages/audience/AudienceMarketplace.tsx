import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleAlert, Database, Info, LandPlot, Map as MapIcon, Plus, RefreshCw, Search, UserX } from "lucide-react";

import type { AudienceRecordsQuery } from "@/api/types/request";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppNote } from "@/components/Note";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useListParams } from "@/hooks/useListParams";
import {
  audienceRecordsQuery,
  audienceSummaryQuery,
  useAudienceLgas,
  useAudienceRecords,
  useAudienceStates,
  useAudienceSummary,
} from "@/store/audienceStore";
import { formatDate, parseApiDate } from "@/utils/format";
import { genderLabels } from "./audienceOptions";
import { RefreshButton, TableSkeleton } from "./audienceShared";
import { UploadAudienceModal } from "./UploadAudienceModal";

const PAGE_SIZE = 20;

const genderOptions = [
  { label: "All Genders", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Unknown", value: "unknown" },
];

const ManageCard = ({
  title,
  description,
  to,
  linkLabel,
  icon,
}: {
  title: string;
  description: string;
  to: string;
  linkLabel: string;
  icon: ReactNode;
}) => (
  <WebAppCard
    title={
      <span className="flex items-center gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">{icon}</span>
        {title}
      </span>
    }
    action={
      <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        {linkLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    }
  >
    <p className="text-sm text-gray-600">{description}</p>
  </WebAppCard>
);

/** LGA filter for the chosen state; LGAs are loaded per state. */
const LgaFilter = ({ state, value, onChange }: { state: string; value: string; onChange: (lga: string) => void }) => {
  const { data: lgas } = useAudienceLgas(state);
  const options = useMemo(
    () => [{ label: "All LGAs", value: "all" }, ...(lgas ?? []).map((lga) => ({ label: lga.name, value: lga.name }))],
    [lgas],
  );
  return (
    <WebAppSelectInput
      id="audienceLga"
      aria-label="LGA"
      options={options}
      value={value}
      onChange={onChange}
      searchable
      searchPlaceholder="Search LGAs..."
      fullWidth={false}
      containerClassName="w-full sm:w-44"
    />
  );
};

export const AudienceMarketplace = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: summary, error: summaryError, loading: summaryLoading } = useAudienceSummary();
  const { data: states } = useAudienceStates();

  // Filters live in the URL so "Back to Audience Marketplace" returns to the same view.
  const { get, update, page } = useListParams({ state: "all", lga: "all", gender: "all", page: "1" });
  const search = get("q");
  const state = get("state");
  const lga = state === "all" ? "all" : get("lga");
  const gender = genderOptions.find((option) => option.value === get("gender"))?.value ?? "all";

  // Contacts are searched, filtered and paged by the API.
  const debouncedSearch = useDebouncedValue(search.trim());
  const query: AudienceRecordsQuery = {
    search: debouncedSearch || undefined,
    state: state === "all" ? undefined : state,
    lga: lga === "all" ? undefined : lga,
    gender: gender === "all" ? undefined : (gender as AudienceRecordsQuery["gender"]),
    page,
    pageSize: PAGE_SIZE,
  };
  const { data: currentRecords, error, loading, refresh } = useAudienceRecords(query);
  // Keep showing the previous page (dimmed) while a new search / filter / page loads.
  const [lastRecords, setLastRecords] = useState(currentRecords);
  if (currentRecords && currentRecords !== lastRecords) setLastRecords(currentRecords);
  const records = currentRecords ?? (error ? null : lastRecords);

  const stateOptions = useMemo(
    () => [
      { label: "All States", value: "all" },
      ...(states ?? []).map((item) => ({ label: item.name, value: item.name })),
    ],
    [states],
  );

  const refreshAll = () => {
    void audienceSummaryQuery.fetch([], { force: true });
    audienceRecordsQuery.invalidate();
    void refresh();
  };

  const filtered = Boolean(query.search || query.state || query.gender);
  const lastUpdated = summary?.lastUpdated ? formatDate(parseApiDate(summary.lastUpdated)) : "—";
  const stat = (value: number | undefined) => (value === undefined ? "…" : value.toLocaleString());

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Audience Marketplace"
        description="Manage the audience database available for campaign targeting."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Audience Marketplace" }]}
        actions={
          <div className="flex gap-3">
            <RefreshButton onClick={refreshAll} loading={loading || summaryLoading} label="Refresh audience" />
            <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
              Upload Audience Database
            </WebAppButton>
          </div>
        }
      />

      {summary?.isSampleData && (
        <WebAppNote tone="warning" icon={<Info />} className="text-sm">
          No audience data has been uploaded yet. The counts below are built-in sample data shown to users until the
          first upload; there are no individual contacts to list.
        </WebAppNote>
      )}
      {summaryError && !summary && (
        <WebAppNote tone="danger" icon={<CircleAlert />} className="text-sm">
          Couldn't load the audience summary: {summaryError.message}
        </WebAppNote>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total Records"
          value={stat(summary?.totalRecords)}
          note={
            summary
              ? `${summary.maleRecords.toLocaleString()} male · ${summary.femaleRecords.toLocaleString()} female`
              : undefined
          }
          icon={Database}
        />
        <WebAppStatCard
          label="Locations Covered"
          value={stat(summary?.locationsCovered)}
          note="Of 36 States + FCT"
          icon={MapIcon}
          to="/audience-marketplace/states"
        />
        <WebAppStatCard
          label="LGAs Covered"
          value={stat(summary?.lgasCovered)}
          note="With contacts loaded"
          icon={LandPlot}
          to="/audience-marketplace/lgas"
        />
        <WebAppStatCard label="Last Updated" value={summary ? lastUpdated : "…"} icon={RefreshCw} />
      </div>

      <WebAppCard
        divided
        title="Audience Database"
        description={records ? `${records.totalCount.toLocaleString()} ${filtered ? "matching " : ""}records` : undefined}
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap gap-3 border-b border-gray-200 px-5 py-4">
          <WebAppInput
            id="audienceSearch"
            type="search"
            placeholder="Search phone or name..."
            aria-label="Search audience by phone number prefix or name"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-64"
          />
          <WebAppSelectInput
            id="audienceState"
            aria-label="State"
            options={stateOptions}
            value={state}
            onChange={(value) => update({ state: value, lga: null, page: null })}
            searchable
            searchPlaceholder="Search states..."
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          {state === "all" ? (
            <WebAppSelectInput
              id="audienceLga"
              aria-label="LGA"
              options={[{ label: "All LGAs", value: "all" }]}
              value="all"
              onChange={() => undefined}
              disabled
              fullWidth={false}
              containerClassName="w-full sm:w-44"
            />
          ) : (
            <LgaFilter key={state} state={state} value={lga} onChange={(value) => update({ lga: value, page: null })} />
          )}
          <WebAppSelectInput
            id="audienceGender"
            aria-label="Gender"
            options={genderOptions}
            value={gender}
            onChange={(value) => update({ gender: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-36"
          />
        </div>

        {!records ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load audience records"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <TableSkeleton label="Loading audience records" />
          )
        ) : records.items.length === 0 ? (
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="No audience records found"
            description={
              filtered
                ? "Try a different search term or filter."
                : "Upload an audience database to add contacts for campaign targeting."
            }
          />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : undefined}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 text-left text-sm">
                <thead className="border-b border-gray-200 text-xs text-gray-600">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Phone Number</th>
                    <th scope="col" className="px-5 py-3 font-semibold">First Name</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Last Name</th>
                    <th scope="col" className="px-5 py-3 font-semibold">State</th>
                    <th scope="col" className="px-5 py-3 font-semibold">LGA</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Gender</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.items.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{record.phoneNumber}</td>
                      <td className="px-5 py-3.5 text-gray-700">{record.firstName ?? "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{record.lastName ?? "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{record.state ?? "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{record.lga ?? "—"}</td>
                      <td className="px-5 py-3.5 text-gray-700">{genderLabels[record.gender]}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/audience-marketplace/records/${encodeURIComponent(record.id)}`}
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
            <WebAppPagination
              className="border-t border-gray-200 px-5 py-4"
              page={records.pageNumber}
              pageSize={records.pageSize}
              total={records.totalCount}
              onPageChange={(next) => update({ page: next })}
              itemLabel="audience records"
            />
          </div>
        )}
      </WebAppCard>

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Location Management</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ManageCard
            title="States & FCT"
            description="Contacts loaded in each of the 36 states and the Federal Capital Territory."
            to="/audience-marketplace/states"
            linkLabel="Manage Locations"
            icon={<MapIcon className="h-4 w-4" />}
          />
          <ManageCard
            title="LGAs"
            description="Local Government Areas with contacts loaded, and their record counts."
            to="/audience-marketplace/lgas"
            linkLabel="Manage LGAs"
            icon={<LandPlot className="h-4 w-4" />}
          />
        </div>
      </section>

      {uploadOpen && <UploadAudienceModal onClose={() => setUploadOpen(false)} />}
    </div>
  );
};
