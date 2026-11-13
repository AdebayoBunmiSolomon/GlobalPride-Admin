import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, CirclePause, Trash2, UserX } from "lucide-react";

import { WebAppAvatar } from "@/components/Avatar";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { mockUserActivity, mockUserCampaigns, mockWalletTransactions } from "@/data/mock";
import { useUsers } from "@/hooks/useUsers";
import { CampaignStatusBadge } from "@/pages/campaigns/StatusBadges";
import { cn } from "@/utils/cn";
import { formatDate, formatNaira, formatRelativeTime } from "@/utils/format";
import { toneStyles } from "@/utils/tones";
import { UserStatusBadge } from "./UserStatusBadge";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "User Management", to: "/users" },
  { label: "User Details" },
];

export const UserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = useUsers((state) => state.users.find((item) => item.id === userId));
  const setStatus = useUsers((state) => state.setStatus);
  const deleteUser = useUsers((state) => state.deleteUser);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const isActive = user.status === "active";

  // TODO: call the users API once the suspend / activate / delete endpoints exist.
  const handleDelete = () => {
    deleteUser(user.id);
    navigate("/users", { replace: true });
  };

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Users", to: "/users" }} />

      <WebAppCard bodyClassName="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <WebAppAvatar name={user.name} variant="soft" size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <UserStatusBadge status={user.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">
              {user.phone} · Joined {formatDate(user.joinedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isActive ? (
            <WebAppButton
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              leftIcon={<CirclePause className="h-4 w-4" />}
              onClick={() => setStatus(user.id, "suspended")}
            >
              Suspend User
            </WebAppButton>
          ) : (
            <WebAppButton
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              leftIcon={<Check className="h-4 w-4" />}
              onClick={() => setStatus(user.id, "active")}
            >
              Activate User
            </WebAppButton>
          )}
          <WebAppButton
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete User
          </WebAppButton>
        </div>
      </WebAppCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <WebAppCard title="Account Information">
          <WebAppDetailList
            align="right"
            className="-my-3"
            items={[
              { label: "Full Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Phone", value: user.phone },
              { label: "Joined", value: formatDate(user.joinedAt) },
              { label: "Campaigns", value: user.campaigns },
              { label: "Wallet Balance", value: formatNaira(user.walletBalance) },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Campaign Activity">
          <ul className="-my-3 divide-y divide-gray-100">
            {mockUserCampaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    {campaign.channel} · {formatDate(campaign.date)}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </li>
            ))}
          </ul>
        </WebAppCard>

        <WebAppCard title="Wallet Activity">
          <ul className="-my-3 divide-y divide-gray-100">
            {mockWalletTransactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.label}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    transaction.amount < 0 ? "text-red-600" : "text-green-700",
                  )}
                >
                  {formatNaira(transaction.amount, { signed: true })}
                </span>
              </li>
            ))}
          </ul>
        </WebAppCard>

        <WebAppCard
          title="Recent Activity"
          action={
            <Link
              to={`/users/${user.id}/activity`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All Activity <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <ul className="-my-3 divide-y divide-gray-100">
            {mockUserActivity.slice(0, 4).map((activity) => (
              <li key={activity.id} className="flex items-center gap-3 py-3">
                <span className={cn("rounded-md p-2", toneStyles[activity.tone].icon)}>
                  <activity.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(activity.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </WebAppCard>
      </div>

      <WebAppModal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete user?">
        <p className="text-sm text-gray-600">
          This will permanently remove {user.name} from the platform. This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </WebAppButton>
          <WebAppButton variant="danger" onClick={handleDelete}>
            Delete user
          </WebAppButton>
        </div>
      </WebAppModal>
    </div>
  );
};
