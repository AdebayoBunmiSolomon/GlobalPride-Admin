import { useState } from "react";

import { handleApiError } from "@/api/utils";
import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import { deleteAudienceRecords } from "@/store/audienceStore";
import { appToast } from "@/utils/appToast";

export interface DeleteRecordsTarget {
  state: string;
  /** Set to delete one LGA's contacts instead of the whole state's. */
  lga?: string;
  totalRecords: number;
}

interface DeleteRecordsModalProps {
  /** What to delete; the modal is hidden while `null`. */
  target: DeleteRecordsTarget | null;
  onClose: () => void;
}

/** Confirms and deletes the stored contacts of one state or LGA (e.g. before re-importing corrected files). */
export const DeleteRecordsModal = ({ target, onClose }: DeleteRecordsModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const place = target ? (target.lga ? `${target.lga}, ${target.state}` : target.state) : "";

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      const { deleted, message } = await deleteAudienceRecords({ state: target.state, lga: target.lga });
      appToast.show(
        "Records deleted",
        message && message !== "Request successful"
          ? message
          : `${(deleted ?? target.totalRecords).toLocaleString()} records in ${place} were deleted.`,
        "success",
      );
      onClose();
    } catch (error) {
      handleApiError(error, { fallbackMessage: "We couldn't delete these records." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <WebAppModal
      open={target !== null}
      onClose={deleting ? () => undefined : onClose}
      title={target ? `Delete ${place} records?` : ""}
    >
      {target && (
        <>
          <p className="text-sm text-gray-600">
            This permanently removes all {target.totalRecords.toLocaleString()} stored contacts in{" "}
            <span className="font-medium text-gray-900">{place}</span>. They will no longer be available for
            campaign targeting until you upload them again.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <WebAppButton variant="outline" onClick={onClose} disabled={deleting}>
              Cancel
            </WebAppButton>
            <WebAppButton variant="danger" onClick={handleDelete} loading={deleting}>
              Delete Records
            </WebAppButton>
          </div>
        </>
      )}
    </WebAppModal>
  );
};
