import { useState } from "react";

import type { AdminAdvertisement } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import {
  deleteAdvertisement,
  endAdvertisement,
  pauseAdvertisement,
  resumeAdvertisement,
} from "@/store/advertisementsStore";
import { appToast } from "@/utils/appToast";
import { DeleteAdvertisementModal, EndAdvertisementModal } from "./AdvertisementParts";

type Action = "pause" | "resume" | "end" | "delete";

const actions = {
  pause: { run: pauseAdvertisement, done: "paused" },
  resume: { run: resumeAdvertisement, done: "resumed" },
  end: { run: endAdvertisement, done: "ended" },
  delete: { run: deleteAdvertisement, done: "deleted" },
} satisfies Record<Action, { run: (ad: AdminAdvertisement) => Promise<{ message: string | null }>; done: string }>;

/**
 * Pause / resume / end / delete with toasts, plus the End and Delete
 * confirmations. Render `modals` once on the page.
 */
export const useAdvertisementActions = ({ onDeleted }: { onDeleted?: () => void } = {}) => {
  /** `${action}:${ad.id}` while a request is in flight. */
  const [busy, setBusy] = useState<string | null>(null);
  const [ending, setEnding] = useState<AdminAdvertisement>();
  const [deleting, setDeleting] = useState<AdminAdvertisement>();

  const run = async (action: Action, ad: AdminAdvertisement) => {
    setBusy(`${action}:${ad.id}`);
    try {
      const { message } = await actions[action].run(ad);
      appToast.show("Success", message || `${ad.name} was ${actions[action].done}.`, "success");
      setEnding(undefined);
      setDeleting(undefined);
      if (action === "delete") onDeleted?.();
    } catch (error) {
      handleApiError(error, { fallbackMessage: `We couldn't update ${ad.name}.` });
    } finally {
      setBusy(null);
    }
  };

  const isBusy = (action: Action, ad: AdminAdvertisement) => busy === `${action}:${ad.id}`;

  const modals = (
    <>
      <EndAdvertisementModal
        advertisement={ending}
        busy={Boolean(ending && isBusy("end", ending))}
        onClose={() => setEnding(undefined)}
        onConfirm={(ad) => void run("end", ad)}
      />
      <DeleteAdvertisementModal
        advertisement={deleting}
        busy={Boolean(deleting && isBusy("delete", deleting))}
        onClose={() => setDeleting(undefined)}
        onConfirm={(ad) => void run("delete", ad)}
      />
    </>
  );

  return {
    pause: (ad: AdminAdvertisement) => void run("pause", ad),
    resume: (ad: AdminAdvertisement) => void run("resume", ad),
    confirmEnd: setEnding,
    confirmDelete: setDeleting,
    isBusy,
    /** Any action in flight. */
    working: busy !== null,
    modals,
  };
};
