import { WebAppBadge } from "@/components/Badge";
import { getCampaignStatusStyle, getRecipientStatusStyle, type BadgeStyle } from "./statusStyles";

const StyledBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);

export const CampaignStatusBadge = ({ status }: { status: string }) => (
  <StyledBadge style={getCampaignStatusStyle(status)} />
);

export const RecipientStatusBadge = ({ status, label }: { status: string | null; label?: string | null }) =>
  status ? <StyledBadge style={getRecipientStatusStyle(status, label)} /> : <span className="text-gray-400">—</span>;
