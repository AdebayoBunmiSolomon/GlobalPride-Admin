import { WebAppBadge } from "@/components/Badge";
import type { ReferralBonusStatus, ReferralStatus } from "@/api/types/response";
import { bonusStatusStyles, referralStatusStyles } from "./referralOptions";

export const ReferralStatusBadge = ({ status }: { status: ReferralStatus }) => {
  const style = referralStatusStyles[status];
  return (
    <WebAppBadge dot variant={style.variant} className={style.className}>
      {style.label}
    </WebAppBadge>
  );
};

export const BonusStatusBadge = ({ status }: { status: ReferralBonusStatus }) => {
  const style = bonusStatusStyles[status];
  return (
    <WebAppBadge dot variant={style.variant} className={style.className}>
      {style.label}
    </WebAppBadge>
  );
};
