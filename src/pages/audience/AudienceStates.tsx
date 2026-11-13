import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPinOff, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { summarizeStates, useAudience } from "@/hooks/useAudience";
import { formatDateOnly } from "@/utils/format";
import {
  LocationStatusBadge,
  LocationStatusModal,
  LocationStatusToggle,
  type LocationStatusTarget,
} from "./LocationStatus";

export const AudienceStates = () => {
  const { states, lgas, setStateStatus } = useAudience();
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<LocationStatusTarget | null>(null);

  const summaries = useMemo(() => summarizeStates(states, lgas), [states, lgas]);
  const query = search.trim().toLowerCase();
  const filtered = summaries.filter((state) => !query || state.name.toLowerCase().includes(query));

  // TODO: call the locations API once the activate / deactivate endpoint exists.
  const handleConfirm = ({ id, status }: LocationStatusTarget) =>
    setStateStatus(id, status === "active" ? "inactive" : "active");

  return (
    <div>
      <WebAppPageHeader
        title="States & FCT"
        description="Manage audience availability across Nigerian states and the Federal Capital Territory."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Audience Marketplace", to: "/audience-marketplace" },
          { label: "States" },
        ]}
        backLink={{ label: "Back to Audience Marketplace", to: "/audience-marketplace" }}
      />

      <WebAppCard
        divided
        title="Locations"
        description={`${filtered.length.toLocaleString()} locations`}
        bodyClassName="p-0"
        action={
          <WebAppInput
            id="locationSearch"
            type="search"
            placeholder="Search locations..."
            aria-label="Search locations"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-64"
          />
        }
      >
        {filtered.length === 0 ? (
          <WebAppEmptyState
            icon={<MapPinOff className="h-6 w-6" />}
            title="No locations found"
            description="Try a different search term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Total Records</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Available Records</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Updated</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((state) => (
                  <tr key={state.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{state.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.totalRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.availableRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <LocationStatusBadge status={state.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDateOnly(state.lastUpdated)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/audience-marketplace/states/${state.id}/lgas`}
                          className="font-medium text-primary hover:underline"
                        >
                          View LGAs
                        </Link>
                        <LocationStatusToggle
                          name={state.name}
                          status={state.status}
                          onClick={() => setTarget({ id: state.id, name: state.name, status: state.status })}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WebAppCard>

      <LocationStatusModal target={target} onConfirm={handleConfirm} onClose={() => setTarget(null)} />
    </div>
  );
};
