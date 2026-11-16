import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, CircleAlert, CirclePause, History, ShieldCheck, Trash2, UserX } from "lucide-react";

import type { ApiError } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { WebAppAvatar } from "@/components/Avatar";
import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { activityStyle } from "@/pages/shared/activityStyle";
import {
  activateUser,
  deleteUser,
  liftUserRestriction,
  suspendUser,
  useUserDetails,
} from "@/store/usersStore";
import { appToast } from "@/utils/appToast";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTimeShort, formatNaira, formatRelativeTime, parseApiDate } from "@/utils/format";
import { toneStyles } from "@/utils/tones";
import { UserStatusBadge } from "./UserStatusBadge";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "User Management", to: "/users" },
  { label: "User Details" },
];

type UserAction = "suspend" | "activate" | "lift" | "delete";

const StatGrid = ({ items }: { items: { label: string; value: string; className?: string }[] }) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
    {items.map((item) => (
      <div key={item.label}>
        <dt className="text-xs text-gray-500">{item.label}</dt>
        <dd className={cn("mt-0.5 text-lg font-semibold text-gray-900", item.className)}>{item.value}</dd>
      </div>
    ))}
  </dl>
);

export const UserDetails = () => {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  // Cached per user (see src/store); actions below update the cache in place.
  const { data: user, error, loading, refresh: retry } = useUserDetails(userId);

  const [busy, setBusy] = useState<UserAction | null>(null);
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeModal = () => {
    setConfirm(null);
    setDeleteError(null);
  };

  if (!user || user.id !== userId) {
    const notFound = error?.status === 404;
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Users", to: "/users" }} />
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={notFound ? <UserX className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
              title={notFound ? "User not found" : "Couldn't load this user"}
              description={notFound ? "This user may have been deleted, or the link is incorrect." : error.message}
              primaryAction={
                notFound ? { label: "Back to Users", onClick: () => navigate("/users") } : { label: "Try again", onClick: retry }
              }
            />
          </WebAppCard>
        ) : (
          <div className="space-y-4" aria-busy={loading} aria-label="Loading user">
            <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isActive = user.status === "active";

  const run = async (action: UserAction, request: () => Promise<string | null | undefined>) => {
    setBusy(action);
    try {
      const message = await request();
      appToast.show("Success", message || "User updated.", "success");
      closeModal();
    } catch (reason) {
      handleApiError(reason);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete");
    setDeleteError(null);
    try {
      const message = await deleteUser(user.id);
      appToast.show("User deleted", message || `${user.name} was deleted.`, "success");
      navigate("/users", { replace: true });
    } catch (reason) {
      const apiError = reason as ApiError;
      // 409: the user has wallet transactions or sent campaigns, which must be kept.
      if (apiError.status === 409) {
        setDeleteError(
          apiError.message ||
            "This user has wallet transactions or sent campaigns, which are financial records that must be kept.",
        );
      } else {
        handleApiError(reason);
      }
      setBusy(null);
    }
  };

  const recentActivity = user.recentActivity.slice(0, 5);
  const { campaignActivity: campaigns, walletActivity: wallet } = user;

  return (
    <div className="space-y-4">
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={{ label: "Back to Users", to: "/users" }} />

      <WebAppCard bodyClassName="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <WebAppAvatar name={user.name} variant="soft" size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <UserStatusBadge status={user.status} restricted={user.restricted} />
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-600">
              {user.phone ? `${user.phone} · ` : ""}Joined {formatDate(parseApiDate(user.joinedAt))}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {user.restricted && (
            <WebAppButton
              variant="outline"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              loading={busy === "lift"}
              disabled={busy !== null}
              onClick={() => run("lift", () => liftUserRestriction(user.id))}
            >
              Lift Restriction
            </WebAppButton>
          )}
          {isActive ? (
            <WebAppButton
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              leftIcon={<CirclePause className="h-4 w-4" />}
              disabled={busy !== null}
              onClick={() => setConfirm("suspend")}
            >
              Suspend User
            </WebAppButton>
          ) : (
            <WebAppButton
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              leftIcon={<Check className="h-4 w-4" />}
              loading={busy === "activate"}
              disabled={busy !== null}
              onClick={() => run("activate", () => activateUser(user.id))}
            >
              Activate User
            </WebAppButton>
          )}
          <WebAppButton
            variant="danger"
            leftIcon={<Trash2 className="h-4 w-4" />}
            disabled={busy !== null}
            onClick={() => setConfirm("delete")}
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
              {
                label: "Email",
                value: (
                  <span className="inline-flex flex-wrap items-center justify-end gap-2">
                    {user.email}
                    <WebAppBadge variant={user.emailVerified ? "success" : "warning"}>
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </WebAppBadge>
                  </span>
                ),
              },
              { label: "Phone", value: user.phone || "—" },
              { label: "Sign-in Method", value: user.signInMethod || "—" },
              { label: "Referral Code", value: user.referralCode || "—" },
              { label: "Joined", value: formatDate(parseApiDate(user.joinedAt)) },
              {
                label: "Last Sign-in",
                value: user.lastLoginAt ? formatDateTimeShort(parseApiDate(user.lastLoginAt)) : "Never",
              },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Wallet Activity">
          <StatGrid
            items={[
              { label: "Wallet Balance", value: formatNaira(user.walletBalance), className: "text-primary" },
              { label: "Total Funded", value: formatNaira(wallet.totalFunded), className: "text-green-700" },
              { label: "Total Spent", value: formatNaira(wallet.totalSpent) },
              { label: "Transactions", value: wallet.transactions.toLocaleString() },
            ]}
          />
        </WebAppCard>

        <WebAppCard title="Campaign Activity">
          <StatGrid
            items={[
              { label: "Total Campaigns", value: campaigns.total.toLocaleString() },
              { label: "Completed", value: campaigns.completed.toLocaleString(), className: "text-green-700" },
              { label: "Scheduled", value: campaigns.scheduled.toLocaleString() },
              { label: "Drafts", value: campaigns.draft.toLocaleString() },
              {
                label: "Failed",
                value: campaigns.failed.toLocaleString(),
                className: campaigns.failed > 0 ? "text-red-600" : undefined,
              },
              { label: "Cancelled", value: campaigns.cancelled.toLocaleString() },
            ]}
          />
          <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-600">
            Total spend on campaigns:{" "}
            <span className="font-semibold text-gray-900">{formatNaira(campaigns.totalSpend)}</span>
          </p>
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
          {recentActivity.length === 0 ? (
            <WebAppEmptyState size="sm" icon={<History className="h-5 w-5" />} title="No activity yet" />
          ) : (
            <ul className="-my-3 divide-y divide-gray-100">
              {recentActivity.map((activity) => {
                const { icon: Icon, tone } = activityStyle(activity.type);
                const createdAt = parseApiDate(activity.createdAt);
                return (
                  <li key={activity.id} className="flex items-start gap-3 py-3">
                    <span className={cn("rounded-md p-2", toneStyles[tone].icon)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <time dateTime={createdAt.toISOString()} title={formatDateTimeShort(createdAt)} className="text-xs text-gray-400">
                        {formatRelativeTime(createdAt)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </WebAppCard>
      </div>

      <WebAppModal open={confirm === "suspend"} onClose={closeModal} title="Suspend user?">
        <p className="text-sm text-gray-600">
          {user.name} will be signed out of every device and won't be able to sign in until you activate them again.
          Their data is kept.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={closeModal} disabled={busy !== null}>
            Cancel
          </WebAppButton>
          <WebAppButton
            variant="danger"
            loading={busy === "suspend"}
            onClick={() => run("suspend", () => suspendUser(user.id))}
          >
            Suspend user
          </WebAppButton>
        </div>
      </WebAppModal>

      <WebAppModal open={confirm === "delete"} onClose={closeModal} title="Delete user?">
        {deleteError ? (
          <div role="alert" className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {deleteError} {isActive && "You can suspend this account instead."}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            This will permanently remove {user.name} from the platform. This action cannot be undone. Users with wallet
            transactions or sent campaigns can't be deleted; suspend them instead.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={closeModal} disabled={busy !== null}>
            Cancel
          </WebAppButton>
          {deleteError ? (
            isActive && (
              <WebAppButton
                variant="danger"
                loading={busy === "suspend"}
                onClick={() => run("suspend", () => suspendUser(user.id))}
              >
                Suspend instead
              </WebAppButton>
            )
          ) : (
            <WebAppButton variant="danger" loading={busy === "delete"} onClick={handleDelete}>
              Delete user
            </WebAppButton>
          )}
        </div>
      </WebAppModal>
    </div>
  );
};
