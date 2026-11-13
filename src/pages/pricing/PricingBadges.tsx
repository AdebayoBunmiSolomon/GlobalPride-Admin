import { WebAppBadge } from "@/components/Badge";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

export const StatusBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);
