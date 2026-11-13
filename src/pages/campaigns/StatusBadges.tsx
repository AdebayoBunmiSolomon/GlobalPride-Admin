import { WebAppBadge } from "@/components/Badge";
import type { CampaignStatus, RecipientStatus } from "@/types/campaign";
import {
  campaignStatusStyles,
  recipientStatusStyles,
  type BadgeStyle,
} from "./statusStyles";

const StyledBadge = ({ style }: { style: BadgeStyle }) => (
  <WebAppBadge dot variant={style.variant} className={style.className}>
    {style.label}
  </WebAppBadge>
);

export const CampaignStatusBadge = ({ status }: { status: CampaignStatus }) => (
  <StyledBadge style={campaignStatusStyles[status]} />
);

export const RecipientStatusBadge = ({ status }: { status: RecipientStatus }) => (
  <StyledBadge style={recipientStatusStyles[status]} />
);
