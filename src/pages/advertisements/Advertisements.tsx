import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, Image, MousePointerClick, Plus, Search } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import type { Advertisement } from "@/types/advertisement";
import { AdvertisementActionMenu } from "./AdvertisementActionMenu";
import { AdThumbnail, AdvertisementStatusBadge, EndAdvertisementModal } from "./AdvertisementParts";
import {
  advertisementStatusFilterOptions,
  formatSchedule,
  placementFilterOptions,
  placementLabels,
  statusRank,
} from "./advertisementOptions";
import { StartDateFilter, type DateRangeValue } from "./StartDateFilter";

const PAGE_SIZE = 10;

const formatMetric = (value?: number) => (value === undefined ? "—" : value.toLocaleString());

export const Advertisements = () => {
  const navigate = useNavigate();
  const { advertisements, pauseAdvertisement, resumeAdvertisement, endAdvertisement } = useAdvertisements();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [placement, setPlacement] = useState("all");
  const [startRange, setStartRange] = useState<DateRangeValue>({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [ending, setEnding] = useState<Advertisement>();

  const stats = useMemo(
    () => ({
      total: advertisements.length,
      active: advertisements.filter((ad) => ad.status === "active").length,
      clicks: advertisements.reduce((sum, ad) => sum + (ad.clicks ?? 0), 0),
    }),
    [advertisements],
  );

  // TODO: move search / filters / paging to the API once the advertisements endpoint exists.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return advertisements
      .filter((ad) => {
        const startDate = ad.startAt.slice(0, 10);
        return (
          (status === "all" || ad.status === status) &&
          (placement === "all" || ad.placement === placement) &&
          (!startRange.from || startDate >= startRange.from) &&
          (!startRange.to || startDate <= startRange.to) &&
          (!query || [ad.id, ad.name, ad.advertiser].some((value) => value.toLowerCase().includes(query)))
        );
      })
      .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.id.localeCompare(b.id));
  }, [advertisements, search, status, placement, startRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageAds = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  // TODO: call the advertisements API once the pause / resume / end endpoints exist.
  const handleEnd = (ad: Advertisement) => {
    endAdvertisement(ad.id);
    setEnding(undefined);
  };

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Advertisement Management"
        description="Create and manage advertisements displayed across the Global Pride app."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Advertisement Management" }]}
        actions={
          <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/advertisements/new")}>
            Create Advertisement
          </WebAppButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <WebAppStatCard
          label="Total Advertisements"
          value={stats.total.toLocaleString()}
          note="All advertisement records, including scheduled and ended ads."
          icon={Image}
        />
        <WebAppStatCard
          label="Currently Active"
          value={stats.active.toLocaleString()}
          note="Advertisements currently eligible to display."
          icon={CircleCheck}
        />
        <WebAppStatCard
          label="Total Clicks"
          value={stats.clicks.toLocaleString()}
          note="Recorded clicks across all advertisements (lifetime)."
          icon={MousePointerClick}
        />
      </div>

      <WebAppCard
        title="Advertisement Records"
        description="View and manage advertisements configured for the mobile app."
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="advertisementSearch"
            type="search"
            placeholder="Search advertisement name or advertiser"
            aria-label="Search advertisement name or advertiser"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="advertisementStatus"
            options={advertisementStatusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          <WebAppSelectInput
            id="advertisementPlacement"
            options={placementFilterOptions}
            value={placement}
            onChange={withPageReset(setPlacement)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <StartDateFilter value={startRange} onChange={withPageReset(setStartRange)} />
        </div>

        {pageAds.length === 0 ? (
          <WebAppEmptyState
            icon={<Image className="h-6 w-6" />}
            title="No advertisements found"
            description="Try a different search term, filter or start date range."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Advertisement</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Advertiser</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Placement</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Schedule</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Impressions</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Clicks</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <AdThumbnail src={ad.creative} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{ad.name}</p>
                          <p className="text-xs text-gray-500">{ad.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{ad.advertiser}</td>
                    <td className="px-5 py-3.5 text-gray-700">{placementLabels[ad.placement]}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatSchedule(ad.startAt, ad.endAt)}</td>
                    <td className="px-5 py-3.5">
                      <AdvertisementStatusBadge status={ad.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{formatMetric(ad.impressions)}</td>
                    <td className="px-5 py-3.5 text-gray-900">{formatMetric(ad.clicks)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link to={`/advertisements/${ad.id}`} className="font-medium text-primary hover:underline">
                          View
                        </Link>
                        <AdvertisementActionMenu
                          advertisement={ad}
                          onEdit={() => navigate(`/advertisements/${ad.id}/edit`)}
                          onPause={() => pauseAdvertisement(ad.id)}
                          onResume={() => resumeAdvertisement(ad.id)}
                          onEnd={() => setEnding(ad)}
                        />
                      </div>
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
            itemLabel="advertisements"
          />
        )}
      </WebAppCard>

      <EndAdvertisementModal advertisement={ending} onClose={() => setEnding(undefined)} onConfirm={handleEnd} />
    </div>
  );
};
