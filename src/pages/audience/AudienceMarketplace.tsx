import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Database, LandPlot, Map as MapIcon, Plus, RefreshCw, Search, UserX } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { getRecordStatus, summarizeStates, useAudience } from "@/hooks/useAudience";
import { formatDateOnly } from "@/utils/format";
import { LocationStatusBadge } from "./LocationStatus";
import { UploadAudienceModal } from "./UploadAudienceModal";

const PAGE_SIZE = 10;

const genderOptions = [
  { label: "All Genders", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const genderLabels = { male: "Male", female: "Female" } as const;

const StatCard = ({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5">
    <div className="flex items-center gap-2.5">
      <span className="rounded-md bg-primary/10 p-1.5 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-xs font-medium text-gray-700">{label}</p>
    </div>
    <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
    {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
  </div>
);

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

export const AudienceMarketplace = () => {
  const { states, lgas, records } = useAudience();
  const [uploadOpen, setUploadOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [stateId, setStateId] = useState("all");
  const [lgaId, setLgaId] = useState("all");
  const [gender, setGender] = useState("all");
  const [page, setPage] = useState(1);

  const stateNames = useMemo(() => new Map(states.map((state) => [state.id, state.name])), [states]);
  const lgaNames = useMemo(() => new Map(lgas.map((lga) => [lga.id, lga.name])), [lgas]);

  const stats = useMemo(() => {
    const summaries = summarizeStates(states, lgas);
    const lastUpdated = [...states, ...lgas].reduce(
      (latest, item) => (item.lastUpdated > latest ? item.lastUpdated : latest),
      "",
    );
    return {
      totalRecords: summaries.reduce((sum, state) => sum + state.totalRecords, 0),
      lastUpdated,
    };
  }, [states, lgas]);

  const stateOptions = useMemo(
    () => [{ label: "All States", value: "all" }, ...states.map((state) => ({ label: state.name, value: state.id }))],
    [states],
  );

  const lgaOptions = useMemo(
    () => [
      { label: "All LGAs", value: "all" },
      ...lgas.filter((lga) => lga.stateId === stateId).map((lga) => ({ label: lga.name, value: lga.id })),
    ],
    [lgas, stateId],
  );

  // TODO: move search / filters / paging to the API once the audience endpoint exists.
  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter(
      (record) =>
        (stateId === "all" || record.stateId === stateId) &&
        (lgaId === "all" || record.lgaId === lgaId) &&
        (gender === "all" || record.gender === gender) &&
        (!query ||
          [record.phone, record.firstName, record.lastName, `${record.firstName} ${record.lastName}`].some(
            (field) => field.toLowerCase().includes(query),
          )),
    );
  }, [records, search, stateId, lgaId, gender]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filteredRecords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Audience Marketplace"
        description="Manage the audience database available for campaign targeting."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Audience Marketplace" }]}
        actions={
          <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
            Upload Audience Database
          </WebAppButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Records" value={stats.totalRecords.toLocaleString()} icon={Database} />
        <StatCard
          label="Locations Covered"
          value={states.length.toLocaleString()}
          note="36 States + FCT"
          icon={MapIcon}
        />
        <StatCard
          label="Last Updated"
          value={stats.lastUpdated ? formatDateOnly(stats.lastUpdated) : "—"}
          icon={RefreshCw}
        />
      </div>

      <WebAppCard divided title="Audience Database" bodyClassName="p-0">
        <div className="flex flex-wrap gap-3 border-b border-gray-200 px-5 py-4">
          <WebAppInput
            id="audienceSearch"
            type="search"
            placeholder="Search audience..."
            aria-label="Search audience"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            fullWidth={false}
            containerClassName="w-full sm:w-64"
          />
          <WebAppSelectInput
            id="audienceState"
            options={stateOptions}
            value={stateId}
            onChange={(value) => {
              setStateId(value);
              setLgaId("all");
              resetPage();
            }}
            searchable
            searchPlaceholder="Search states..."
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="audienceLga"
            options={lgaOptions}
            value={lgaId}
            onChange={(value) => {
              setLgaId(value);
              resetPage();
            }}
            disabled={stateId === "all"}
            searchable
            searchPlaceholder="Search LGAs..."
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id="audienceGender"
            options={genderOptions}
            value={gender}
            onChange={(value) => {
              setGender(value);
              resetPage();
            }}
            fullWidth={false}
            containerClassName="w-full sm:w-36"
          />
        </div>

        {pageRecords.length === 0 ? (
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="No audience records found"
            description="Try a different search term or filter."
          />
        ) : (
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
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{record.phone}</td>
                    <td className="px-5 py-3.5 text-gray-700">{record.firstName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{record.lastName}</td>
                    <td className="px-5 py-3.5 text-gray-700">{stateNames.get(record.stateId)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lgaNames.get(record.lgaId)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{genderLabels[record.gender]}</td>
                    <td className="px-5 py-3.5">
                      <LocationStatusBadge status={getRecordStatus(record, states, lgas)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/audience-marketplace/records/${record.id}`}
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

        {filteredRecords.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filteredRecords.length}
            onPageChange={setPage}
            itemLabel="audience records"
          />
        )}
      </WebAppCard>

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">Location Management</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ManageCard
            title="States & FCT"
            description="Manage the 36 Nigerian states and Federal Capital Territory."
            to="/audience-marketplace/states"
            linkLabel="Manage Locations"
            icon={<MapIcon className="h-4 w-4" />}
          />
          <ManageCard
            title="LGAs"
            description="Manage Local Government Areas and their available audience records."
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
