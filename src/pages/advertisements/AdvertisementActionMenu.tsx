import { CirclePause, CirclePlay, CircleStop, Pencil, Trash2 } from "lucide-react";

import type { AdminAdvertisement } from "@/api/types/response";
import { WebAppActionMenu, type ActionMenuItem } from "@/components/ActionMenu";
import { getAdvertisementActions } from "./advertisementOptions";

interface AdvertisementActionMenuProps {
  advertisement: AdminAdvertisement;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onDelete: () => void;
}

/** Row "⋮" menu; the lifecycle actions offered depend on the ad's status. */
export const AdvertisementActionMenu = ({
  advertisement,
  onEdit,
  onPause,
  onResume,
  onEnd,
  onDelete,
}: AdvertisementActionMenuProps) => {
  const { canEdit, canPause, canResume, canEnd } = getAdvertisementActions(advertisement.status);

  const items: ActionMenuItem[] = [
    ...(canEdit ? [{ label: "Edit", icon: Pencil, onSelect: onEdit }] : []),
    ...(canPause ? [{ label: "Pause", icon: CirclePause, onSelect: onPause }] : []),
    ...(canResume ? [{ label: "Resume", icon: CirclePlay, onSelect: onResume }] : []),
    ...(canEnd ? [{ label: "End", icon: CircleStop, onSelect: onEnd, danger: true, separated: true }] : []),
    { label: "Delete", icon: Trash2, onSelect: onDelete, danger: true, separated: !canEnd },
  ];

  return <WebAppActionMenu label={`Actions for ${advertisement.name}`} items={items} />;
};
