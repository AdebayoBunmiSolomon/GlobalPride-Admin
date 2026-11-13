import { Info } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { useSettings } from "@/hooks/useSettings";
import { SettingsLayout } from "./SettingsLayout";

const notAvailable = <span className="font-normal text-gray-500">Not available</span>;

export const PlatformInformation = () => {
  const platformName = useSettings((state) => state.general.platformName);

  return (
    <SettingsLayout
      title="Platform Information"
      description="View Global Pride platform and system information."
      section="Platform Information"
    >
      <WebAppCard divided title="System Information" description="Read-only information about the deployed platform.">
        {/* TODO: read environment, version, last deploy and API health from the backend once it is connected. */}
        <WebAppDetailList
          align="right"
          className="-my-3"
          items={[
            { label: "Platform Name", value: platformName },
            { label: "Environment", value: notAvailable },
            { label: "Platform Version", value: notAvailable },
            { label: "Last Updated", value: notAvailable },
            { label: "API Status", value: notAvailable },
          ]}
        />
      </WebAppCard>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-stone-50 px-4 py-3 text-xs text-gray-600">
        <Info className="h-4 w-4 shrink-0 text-gray-400" />
        Platform and system information becomes available once the platform backend is connected.
      </div>
    </SettingsLayout>
  );
};
