import { WebAppBadge } from "@/components/Badge";
import type { AdminUserStatus } from "@/api/types/response";

interface UserStatusBadgeProps {
  status: AdminUserStatus;
  /** Also shows a "Restricted" badge (blocked from sending campaigns by a compliance decision). */
  restricted?: boolean;
}

export const UserStatusBadge = ({ status, restricted = false }: UserStatusBadgeProps) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    {status === "active" ? (
      <WebAppBadge dot variant="success" className="text-green-700">
        Active
      </WebAppBadge>
    ) : (
      <WebAppBadge dot variant="danger" className="text-red-600">
        Suspended
      </WebAppBadge>
    )}
    {restricted && (
      <WebAppBadge dot variant="warning" className="text-amber-700">
        Restricted
      </WebAppBadge>
    )}
  </span>
);
