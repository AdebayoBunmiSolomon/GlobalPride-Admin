import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircleAlert, MapPinOff, Search } from "lucide-react";

import type { AudienceLgaRow, ApiError } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useAllAudienceLgas, useAudienceLgas, useAudienceStates, useAudienceSummary } from "@/store/audienceStore";
import { DeleteRecordsModal, type DeleteRecordsTarget } from "./DeleteRecordsModal";
import { RefreshButton, TableSkeleton } from "./audienceShared";

const PAGE_SIZE = 20;

const statesCrumb = { label: "States", to: "/audience-marketplace/states" };
const marketplaceCrumb = { label: "Audience Marketplace", to: "/audience-marketplace" };
const dashboardCrumb = { label: "Dashboard", to: "/dashboard" };

/**
 * Serves both `/audience-marketplace/lgas` (every LGA with contacts) and
 * `/audience-marketplace/states/:stateId/lgas` (one state, by name, from "View LGAs").
 */
export const AudienceLgas = () => {
  const { stateId } = useParams();
  return stateId ? <StateLgas key={stateId} state={stateId} /> : <AllLgas />;
};

/** One state's LGAs. */
const StateLgas = ({ state }: { state: string }) => {
  const navigate = useNavigate();
  const { data: states } = useAudienceStates();
  const { data, error, loading, refresh } = useAudienceLgas(state);
  const known = !states || states.some((item) => item.name.toLowerCase() === state.toLowerCase());

  if (!known || error?.status === 404) {
    return (
      <div>
        <WebAppPageHeader
          breadcrumbs={[dashboardCrumb, marketplaceCrumb, statesCrumb, { label: "LGAs" }]}
          backLink={{ label: "Back to States", to: "/audience-marketplace/states" }}
        />
        <WebAppCard>
          <WebAppEmptyState
            icon={<MapPinOff className="h-6 w-6" />}
            title="State not found"
            description="This state doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to States", onClick: () => navigate("/audience-marketplace/states") }}
          />
        </WebAppCard>
      </div>
    );
  }

  return (
    <LgaList
      title={`${state} LGAs`}
      breadcrumbs={[dashboardCrumb, marketplaceCrumb, statesCrumb, { label: state }]}
      backLink={{ label: "Back to States", to: "/audience-marketplace/states" }}
      lgas={data}
      error={error}
      loading={loading}
      refresh={refresh}
    />
  );
};

/** Every LGA with contacts, across all states. */
const AllLgas = () => {
  const { data, error, loading, refresh } = useAllAudienceLgas();
  return (
    <LgaList
      title="LGAs"
      breadcrumbs={[dashboardCrumb, marketplaceCrumb, { label: "LGAs" }]}
      backLink={{ label: "Back to Audience Marketplace", to: "/audience-marketplace" }}
      lgas={data}
      error={error}
      loading={loading}
      refresh={refresh}
      stateFilter
    />
  );
};

interface LgaListProps {
  title: string;
  breadcrumbs: { label: string; to?: string }[];
  backLink: { label: string; to: string };
  lgas: AudienceLgaRow[] | null;
  error: ApiError | null;
  loading: boolean;
  refresh: () => void;
  /** Show a state filter (the all-LGAs view). */
  stateFilter?: boolean;
}

const LgaList = ({ title, breadcrumbs, backLink, lgas, error, loading, refresh, stateFilter }: LgaListProps) => {
  // Sample data isn't stored, so there is nothing to delete until the first upload.
  const isSampleData = useAudienceSummary().data?.isSampleData ?? true;
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<DeleteRecordsTarget | null>(null);

  const stateOptions = useMemo(
    () => [
      { label: "All States", value: "all" },
      ...[...new Set((lgas ?? []).map((lga) => lga.state))].sort().map((name) => ({ label: name, value: name })),
    ],
    [lgas],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (lgas ?? []).filter(
      (lga) => (state === "all" || lga.state === state) && (!query || lga.name.toLowerCase().includes(query)),
    );
  }, [lgas, search, state]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageLgas = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <WebAppPageHeader
        title={title}
        description="Local Government Areas with contacts loaded."
        breadcrumbs={breadcrumbs}
        backLink={backLink}
        actions={<RefreshButton onClick={refresh} loading={loading} label="Refresh LGAs" />}
      />

      <WebAppCard
        divided
        title="LGAs"
        description={lgas ? `${filtered.length.toLocaleString()} LGAs` : undefined}
        bodyClassName="p-0"
        action={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <WebAppInput
              id="lgaSearch"
              type="search"
              placeholder="Search LGAs..."
              aria-label="Search LGAs"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-full sm:w-56"
            />
            {stateFilter && (
              <WebAppSelectInput
                id="lgaState"
                aria-label="State"
                options={stateOptions}
                value={state}
                onChange={(value) => {
                  setState(value);
                  setPage(1);
                }}
                searchable
                searchPlaceholder="Search states..."
                fullWidth={false}
                containerClassName="w-full sm:w-48"
              />
            )}
          </div>
        }
      >
        {!lgas ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load LGAs"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <TableSkeleton label="Loading LGAs" rows={10} />
          )
        ) : pageLgas.length === 0 ? (
          <WebAppEmptyState
            icon={<MapPinOff className="h-6 w-6" />}
            title="No LGAs found"
            description={lgas.length === 0 ? "No contacts have been loaded here yet." : "Try a different search term or state."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">LGA</th>
                  <th scope="col" className="px-5 py-3 font-semibold">State</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Total Records</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Male</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Female</th>
                  {!isSampleData && <th scope="col" className="px-5 py-3 font-semibold">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageLgas.map((lga) => (
                  <tr key={`${lga.state}|${lga.name}`} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{lga.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.state}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.totalRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.maleRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.femaleRecords.toLocaleString()}</td>
                    {!isSampleData && (
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setTarget({ state: lga.state, lga: lga.name, totalRecords: lga.totalRecords })
                          }
                          aria-label={`Delete ${lga.name} records`}
                          className="font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
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
            itemLabel="LGAs"
          />
        )}
      </WebAppCard>

      <DeleteRecordsModal target={target} onClose={() => setTarget(null)} />
    </div>
  );
};
