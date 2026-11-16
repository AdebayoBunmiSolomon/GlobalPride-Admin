import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CircleAlert, History, UserX } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { activityStyle, activityTypeOptions } from "@/pages/shared/activityStyle";
import { useUserActivity, useUserDetails } from "@/store/usersStore";
import { cn } from "@/utils/cn";
import { formatDateTime, parseApiDate } from "@/utils/format";
import { toneStyles } from "@/utils/tones";

const PAGE_SIZE = 20;

export const UserActivity = () => {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const type = activityTypeOptions.find((option) => option.value === searchParams.get("type"))?.value ?? "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Usually already cached from User Details (see src/store).
  const userQuery = useUserDetails(userId);
  const userName = userQuery.data?.name;

  const { data, error, loading, refresh: retry } = useUserActivity(
    userId,
    type === "all" ? undefined : type,
    page,
    PAGE_SIZE,
  );

  const setParams = (next: { type?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextType = next.type ?? type;
    const nextPage = next.page ?? 1;
    if (nextType !== "all") params.set("type", nextType);
    if (nextPage > 1) params.set("page", String(nextPage));
    setSearchParams(params, { replace: true });
  };

  const breadcrumbs = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "User Management", to: "/users" },
    { label: "User Details", to: `/users/${userId}` },
    { label: "User Activity" },
  ];

  if (error?.status === 404 || userQuery.error?.status === 404) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Users", to: "/users" }} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="User not found"
            description="This user may have been deleted, or the link is incorrect."
            primaryAction={{ label: "Back to Users", onClick: () => navigate("/users") }}
          />
        </WebAppCard>
      </div>
    );
  }

  const activities = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  return (
    <div>
      <WebAppPageHeader
        title="User Activity"
        description={userName ? `View activity for ${userName}.` : "View this user's activity."}
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to User Details", to: `/users/${userId}` }}
      />

      <WebAppCard
        divided
        title="Activity"
        description={data ? `${total.toLocaleString()} ${total === 1 ? "activity" : "activities"} · newest first` : "Loading…"}
        bodyClassName="p-0"
        action={
          <div className="flex items-center gap-3">
            <label htmlFor="activityType" className="text-sm text-gray-600">
              Activity Type
            </label>
            <WebAppSelectInput
              id="activityType"
              options={activityTypeOptions}
              value={type}
              onChange={(value) => setParams({ type: value })}
              fullWidth={false}
              containerClassName="w-52"
            />
          </div>
        }
      >
        {error && !data ? (
          <WebAppEmptyState
            icon={<CircleAlert className="h-6 w-6" />}
            title="Couldn't load activity"
            description={error.message}
            primaryAction={{ label: "Try again", onClick: retry }}
          />
        ) : !data ? (
          <div className="space-y-px" aria-busy="true" aria-label="Loading activity">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <WebAppEmptyState
            icon={<History className="h-6 w-6" />}
            title="No activity"
            description={type === "all" ? "This user has no activity yet." : "There is no activity of this type yet."}
          />
        ) : (
          <>
            {error && (
              <div role="alert" className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-5 py-2.5 text-sm text-red-700">
                <CircleAlert className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error.message}</span>
                <button type="button" onClick={retry} className="font-medium hover:underline">
                  Retry
                </button>
              </div>
            )}
            <ul className={cn("divide-y divide-gray-100 px-5 transition-opacity", loading && "opacity-60")} aria-busy={loading}>
              {activities.map((activity) => {
                const { icon: Icon, tone } = activityStyle(activity.type);
                const createdAt = parseApiDate(activity.createdAt);
                return (
                  <li key={activity.id} className="flex flex-wrap items-start gap-3 py-3.5">
                    <span className={cn("rounded-md p-2", toneStyles[tone].icon)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                    </div>
                    <time dateTime={createdAt.toISOString()} className="text-sm text-gray-600">
                      {formatDateTime(createdAt)}
                    </time>
                  </li>
                );
              })}
            </ul>
            <WebAppPagination
              className="border-t border-gray-200 px-5 py-4"
              page={data.pageNumber}
              pageSize={data.pageSize}
              total={total}
              onPageChange={(next) => setParams({ page: next })}
              itemLabel="activities"
            />
          </>
        )}
      </WebAppCard>
    </div>
  );
};
