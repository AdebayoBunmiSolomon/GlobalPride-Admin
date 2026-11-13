import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { History, UserX } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { mockUserActivity } from "@/data/mock";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { toneStyles } from "@/utils/tones";

const PAGE_SIZE = 10;

const activityTypeOptions = [
  { label: "All Activity", value: "all" },
  { label: "Account", value: "account" },
  { label: "Campaigns", value: "campaign" },
  { label: "Wallet", value: "wallet" },
  { label: "Referrals", value: "referral" },
];

export const UserActivity = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = useUsers((state) => state.users.find((item) => item.id === userId));

  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  // TODO: fetch this user's activity from the API (with type + page params).
  const activities = useMemo(
    () => mockUserActivity.filter((activity) => type === "all" || activity.type === type),
    [type],
  );

  const pageActivities = activities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const breadcrumbs = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "User Management", to: "/users" },
    { label: "User Details", to: `/users/${userId}` },
    { label: "User Activity" },
  ];

  if (!user) {
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

  return (
    <div>
      <WebAppPageHeader
        title="User Activity"
        description={`View recent activity for ${user.name}.`}
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Back to User Details", to: `/users/${user.id}` }}
      />

      <WebAppCard
        divided
        title="Activity"
        description={`${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
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
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
              fullWidth={false}
              containerClassName="w-44"
            />
          </div>
        }
      >
        {pageActivities.length === 0 ? (
          <WebAppEmptyState
            icon={<History className="h-6 w-6" />}
            title="No activity"
            description="There is no activity of this type yet."
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100 px-5">
              {pageActivities.map((activity) => (
                <li key={activity.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <span className={cn("rounded-md p-2", toneStyles[activity.tone].icon)}>
                    <activity.icon className="h-4 w-4" />
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-medium text-gray-900">
                    {activity.text}
                  </p>
                  <time dateTime={activity.at} className="text-sm text-gray-600">
                    {formatDateTime(activity.at)}
                  </time>
                </li>
              ))}
            </ul>
            <WebAppPagination
              className="border-t border-gray-200 px-5 py-4"
              page={page}
              pageSize={PAGE_SIZE}
              total={activities.length}
              onPageChange={setPage}
              itemLabel="activities"
            />
          </>
        )}
      </WebAppCard>
    </div>
  );
};
