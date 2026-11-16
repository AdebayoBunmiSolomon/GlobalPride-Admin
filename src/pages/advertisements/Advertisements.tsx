import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleAlert, CircleCheck, Eye, Image, MousePointerClick, Plus, RefreshCw, Search } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { WebAppStatCard } from "@/components/StatCard";
import { useListParams } from "@/hooks/useListParams";
import { advertisementSummaryQuery, useAdvertisementList, useAdvertisementSummary } from "@/store/advertisementsStore";
import { cn } from "@/utils/cn";
import { AdvertisementActionMenu } from "./AdvertisementActionMenu";
import { AdThumbnail, AdvertisementStatusBadge } from "./AdvertisementParts";
import {
  advertisementStatusFilterOptions,
  formatSchedule,
  placementFilterOptions,
  placementLabel,
  statusRank,
  toLocalDate,
} from "./advertisementOptions";
import { StartDateFilter, type DateRangeValue } from "./StartDateFilter";
import { useAdvertisementActions } from "./useAdvertisementActions";

const PAGE_SIZE = 10;

const formatMetric = (value: number | null) => (value === null ? "—" : value.toLocaleString());

export const Advertisements = () => {
  const navigate = useNavigate();
  // Filters live in the URL so "Back to Advertisement Management" returns to the same view.
  const { get, update, page: requestedPage } = useListParams({ status: "all", placement: "all", page: "1" });
  const search = get("q");
  const status = advertisementStatusFilterOptions.find((option) => option.value === get("status"))?.value ?? "all";
  const placement = get("placement") || "all";
  const startRange: DateRangeValue = { from: get("from"), to: get("to") };

  const { data: summary, error: summaryError } = useAdvertisementSummary();
  // Every advertisement is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: advertisements, error, loading, refresh } = useAdvertisementList();
  const { pause, resume, confirmEnd, confirmDelete, modals } = useAdvertisementActions();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (advertisements ?? [])
      .filter((ad) => {
        const startDate = ad.startAt ? toLocalDate(ad.startAt) : "";
        return (
          (status === "all" || ad.status === status) &&
          (placement === "all" || ad.placement === placement) &&
          (!startRange.from || startDate >= startRange.from) &&
          (!startRange.to || startDate <= startRange.to) &&
          (!query || [ad.code, ad.name, ad.advertiser].some((value) => value.toLowerCase().includes(query)))
        );
      })
      .sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.startAt.localeCompare(a.startAt));
  }, [advertisements, search, status, placement, startRange.from, startRange.to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageAds = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const refreshAll = () => {
    void advertisementSummaryQuery.fetch([], { force: true });
    void refresh();
  };

  const count = (value: number | undefined) => (value === undefined ? "…" : value.toLocaleString());
  const total = advertisements?.length ?? 0;
  const description = !advertisements
    ? "Loading advertisements…"
    : filtered.length === total
      ? `${total.toLocaleString()} advertisements`
      : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} advertisements`;

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Advertisement Management"
        description="Create and manage advertisements displayed across the Global Pride app."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Advertisement Management" }]}
        actions={
          <>
            <button
              type="button"
              onClick={refreshAll}
              disabled={loading}
              aria-label="Refresh advertisements"
              title="Refresh"
              className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/advertisements/new")}>
              Create Advertisement
            </WebAppButton>
          </>
        }
      />

      {summaryError && !summary && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <CircleAlert className="h-4 w-4" />
          Couldn't load the advertisement summary: {summaryError.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WebAppStatCard
          label="Total Advertisements"
          value={count(summary?.total)}
          note={
            summary
              ? `${summary.scheduled.toLocaleString()} scheduled · ${summary.paused.toLocaleString()} paused · ${summary.ended.toLocaleString()} ended`
              : "All advertisement records, including scheduled and ended ads."
          }
          icon={Image}
        />
        <WebAppStatCard
          label="Currently Active"
          value={count(summary?.active)}
          note="Advertisements currently eligible to display."
          icon={CircleCheck}
        />
        <WebAppStatCard
          label="Total Impressions"
          value={count(summary?.totalImpressions)}
          note="Times advertisements were shown in the app (lifetime)."
          icon={Eye}
        />
        <WebAppStatCard
          label="Total Clicks"
          value={count(summary?.totalClicks)}
          note={
            summary
              ? `${summary.clickThroughRatePercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}% click-through rate (lifetime).`
              : "Recorded clicks across all advertisements (lifetime)."
          }
          icon={MousePointerClick}
        />
      </div>

      <WebAppCard title="Advertisement Records" description={description} bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 pt-4 pb-5">
          <WebAppInput
            id="advertisementSearch"
            type="search"
            placeholder="Search name, code or advertiser"
            aria-label="Search advertisement name, code or advertiser"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id="advertisementStatus"
            options={advertisementStatusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          <WebAppSelectInput
            id="advertisementPlacement"
            options={placementFilterOptions}
            value={placement}
            onChange={(value) => update({ placement: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <StartDateFilter value={startRange} onChange={({ from, to }) => update({ from, to, page: null })} />
        </div>

        {!advertisements ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load advertisements"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          ) : (
            <div className="space-y-2 p-5" aria-busy="true" aria-label="Loading advertisements">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )
        ) : pageAds.length === 0 ? (
          <WebAppEmptyState
            icon={<Image className="h-6 w-6" />}
            title={total === 0 ? "No advertisements yet" : "No advertisements found"}
            description={
              total === 0
                ? "Create an advertisement to show it in the app's Home Feed."
                : "Try a different search term, filter or start date range."
            }
            primaryAction={
              total === 0 ? { label: "Create Advertisement", onClick: () => navigate("/advertisements/new") } : undefined
            }
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
                        <AdThumbnail src={ad.creativeUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{ad.name}</p>
                          <p className="text-xs text-gray-500">{ad.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{ad.advertiser || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-700">{placementLabel(ad.placement)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatSchedule(ad.startAt, ad.endAt)}</td>
                    <td className="px-5 py-3.5">
                      <AdvertisementStatusBadge status={ad.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{formatMetric(ad.impressions)}</td>
                    <td className="px-5 py-3.5 text-gray-900">{formatMetric(ad.clicks)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/advertisements/${encodeURIComponent(ad.code)}`}
                          className="font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                        <AdvertisementActionMenu
                          advertisement={ad}
                          onEdit={() => navigate(`/advertisements/${encodeURIComponent(ad.code)}/edit`)}
                          onPause={() => pause(ad)}
                          onResume={() => resume(ad)}
                          onEnd={() => confirmEnd(ad)}
                          onDelete={() => confirmDelete(ad)}
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
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel="advertisements"
          />
        )}
      </WebAppCard>

      {modals}
    </div>
  );
};
