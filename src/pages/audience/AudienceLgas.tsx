import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPinOff, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useAudience } from "@/hooks/useAudience";
import type { AudienceState } from "@/types/audience";
import {
  LocationStatusBadge,
  LocationStatusModal,
  LocationStatusToggle,
  type LocationStatusTarget,
} from "./LocationStatus";

const PAGE_SIZE = 20;

/**
 * Serves both `/audience-marketplace/lgas` (all LGAs) and
 * `/audience-marketplace/states/:stateId/lgas` (opened from a state's "View LGAs").
 */
export const AudienceLgas = () => {
  const { stateId } = useParams();
  const navigate = useNavigate();
  const states = useAudience((store) => store.states);
  const parentState = stateId ? states.find((state) => state.id === stateId) : undefined;

  if (stateId && !parentState) {
    return (
      <div>
        <WebAppPageHeader
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Audience Marketplace", to: "/audience-marketplace" },
            { label: "States", to: "/audience-marketplace/states" },
            { label: "LGAs" },
          ]}
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

  // Keyed so the state filter resets when moving between states.
  return <LgaList key={stateId ?? "all"} parentState={parentState} />;
};

const LgaList = ({ parentState }: { parentState?: AudienceState }) => {
  const { states, lgas, setLgaStatus } = useAudience();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState(parentState?.id ?? "all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<LocationStatusTarget | null>(null);

  const stateNames = useMemo(() => new Map(states.map((state) => [state.id, state.name])), [states]);
  const stateOptions = useMemo(
    () => [{ label: "All States", value: "all" }, ...states.map((state) => ({ label: state.name, value: state.id }))],
    [states],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return lgas.filter(
      (lga) =>
        (stateFilter === "all" || lga.stateId === stateFilter) &&
        (!query || lga.name.toLowerCase().includes(query)),
    );
  }, [lgas, search, stateFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageLgas = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // TODO: call the locations API once the activate / deactivate endpoint exists.
  const handleConfirm = ({ id, status }: LocationStatusTarget) =>
    setLgaStatus(id, status === "active" ? "inactive" : "active");

  const breadcrumbs = parentState
    ? [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Audience Marketplace", to: "/audience-marketplace" },
        { label: "States", to: "/audience-marketplace/states" },
        { label: parentState.name, to: "/audience-marketplace/states" },
        { label: "LGAs" },
      ]
    : [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Audience Marketplace", to: "/audience-marketplace" },
        { label: "LGAs" },
      ];

  return (
    <div>
      <WebAppPageHeader
        title="LGAs"
        description="Manage Local Government Areas and their available audience records."
        breadcrumbs={breadcrumbs}
        backLink={
          parentState
            ? { label: "Back to States", to: "/audience-marketplace/states" }
            : { label: "Back to Audience Marketplace", to: "/audience-marketplace" }
        }
      />

      <WebAppCard
        divided
        title="LGAs"
        description={`${filtered.length.toLocaleString()} LGAs`}
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
            <WebAppSelectInput
              id="lgaState"
              options={stateOptions}
              value={stateFilter}
              onChange={(value) => {
                setStateFilter(value);
                setPage(1);
              }}
              searchable
              searchPlaceholder="Search states..."
              fullWidth={false}
              containerClassName="w-full sm:w-48"
            />
          </div>
        }
      >
        {pageLgas.length === 0 ? (
          <WebAppEmptyState
            icon={<MapPinOff className="h-6 w-6" />}
            title="No LGAs found"
            description="Try a different search term or state."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">LGA</th>
                  <th scope="col" className="px-5 py-3 font-semibold">State</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Total Records</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Available Records</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageLgas.map((lga) => (
                  <tr key={lga.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{lga.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{stateNames.get(lga.stateId)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.totalRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{lga.availableRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <LocationStatusBadge status={lga.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <LocationStatusToggle
                        name={lga.name}
                        status={lga.status}
                        onClick={() => setTarget({ id: lga.id, name: lga.name, status: lga.status })}
                      />
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
            itemLabel="LGAs"
          />
        )}
      </WebAppCard>

      <LocationStatusModal target={target} onConfirm={handleConfirm} onClose={() => setTarget(null)} />
    </div>
  );
};
