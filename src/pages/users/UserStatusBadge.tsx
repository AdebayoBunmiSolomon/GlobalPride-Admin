import { WebAppBadge } from "@/components/Badge";
import type { UserStatus } from "@/types/user";

export const UserStatusBadge = ({ status }: { status: UserStatus }) =>
  status === "active" ? (
    <WebAppBadge dot variant="success" className="text-green-700">
      Active
    </WebAppBadge>
  ) : (
    <WebAppBadge dot variant="danger" className="text-red-600">
      Suspended
    </WebAppBadge>
  );
