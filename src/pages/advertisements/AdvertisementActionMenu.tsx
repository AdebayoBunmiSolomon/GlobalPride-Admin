import { CirclePause, CirclePlay, CircleStop, Pencil } from "lucide-react";

import { WebAppActionMenu, type ActionMenuItem } from "@/components/ActionMenu";
import type { Advertisement } from "@/types/advertisement";
import { getAdvertisementActions } from "./advertisementOptions";

interface AdvertisementActionMenuProps {
  advertisement: Advertisement;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

/** Row "⋮" menu; the lifecycle actions offered depend on the ad's status. */
export const AdvertisementActionMenu = ({
  advertisement,
  onEdit,
  onPause,
  onResume,
  onEnd,
}: AdvertisementActionMenuProps) => {
  const { canPause, canResume, canEnd } = getAdvertisementActions(advertisement.status);

  const items: ActionMenuItem[] = [
    { label: "Edit", icon: Pencil, onSelect: onEdit },
    ...(canPause ? [{ label: "Pause", icon: CirclePause, onSelect: onPause }] : []),
    ...(canResume ? [{ label: "Resume", icon: CirclePlay, onSelect: onResume }] : []),
    ...(canEnd ? [{ label: "End", icon: CircleStop, onSelect: onEnd, danger: true, separated: true }] : []),
  ];

  return <WebAppActionMenu label={`Actions for ${advertisement.name}`} items={items} />;
};
