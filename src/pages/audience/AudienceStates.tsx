import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, MapPinOff, Search } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { useAudienceStates, useAudienceSummary } from "@/store/audienceStore";
import { DeleteRecordsModal, type DeleteRecordsTarget } from "./DeleteRecordsModal";
import { stateLgasPath } from "./audienceOptions";
import { RefreshButton, TableSkeleton } from "./audienceShared";

export const AudienceStates = () => {
  const { data: states, error, loading, refresh } = useAudienceStates();
  // Sample data isn't stored, so there is nothing to delete until the first upload.
  const isSampleData = useAudienceSummary().data?.isSampleData ?? true;
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<DeleteRecordsTarget | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (states ?? []).filter((state) => !query || state.name.toLowerCase().includes(query));
  }, [states, search]);

  const withData = states?.filter((state) => state.totalRecords > 0).length ?? 0;

  return (
    <div>
      <WebAppPageHeader
        title="States & FCT"
        description="Contacts loaded in each Nigerian state and the Federal Capital Territory."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Audience Marketplace", to: "/audience-marketplace" },
          { label: "States" },
        ]}
        backLink={{ label: "Back to Audience Marketplace", to: "/audience-marketplace" }}
        actions={<RefreshButton onClick={refresh} loading={loading} label="Refresh states" />}
      />

      <WebAppCard
        divided
        title="Locations"
        description={
          states
            ? `${filtered.length.toLocaleString()} locations · ${withData.toLocaleString()} with contacts`
            : undefined
        }
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
        {!states ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load states"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <TableSkeleton label="Loading states" rows={10} />
          )
        ) : filtered.length === 0 ? (
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
                  <th scope="col" className="px-5 py-3 font-semibold">Male</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Female</th>
                  <th scope="col" className="px-5 py-3 font-semibold">LGAs</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((state) => (
                  <tr key={state.name} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{state.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.totalRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.maleRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.femaleRecords.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-700">{state.lgaCount.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {state.lgaCount > 0 ? (
                          <Link to={stateLgasPath(state.name)} className="font-medium text-primary hover:underline">
                            View LGAs
                          </Link>
                        ) : (
                          <span className="text-gray-400">No data</span>
                        )}
                        {!isSampleData && state.totalRecords > 0 && (
                          <button
                            type="button"
                            onClick={() => setTarget({ state: state.name, totalRecords: state.totalRecords })}
                            aria-label={`Delete ${state.name} records`}
                            className="font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WebAppCard>

      <DeleteRecordsModal target={target} onClose={() => setTarget(null)} />
    </div>
  );
};
