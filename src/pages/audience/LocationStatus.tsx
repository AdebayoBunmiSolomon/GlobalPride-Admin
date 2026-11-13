import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import type { LocationStatus } from "@/types/audience";

export const LocationStatusBadge = ({ status }: { status: LocationStatus }) =>
  status === "active" ? (
    <WebAppBadge dot variant="success" className="text-green-700">
      Active
    </WebAppBadge>
  ) : (
    <WebAppBadge dot variant="neutral">
      Inactive
    </WebAppBadge>
  );

/** Table action that flips a location between active and inactive. */
export const LocationStatusToggle = ({
  name,
  status,
  onClick,
}: {
  name: string;
  status: LocationStatus;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${status === "active" ? "Deactivate" : "Activate"} ${name}`}
    className={
      status === "active"
        ? "font-medium text-red-600 hover:underline"
        : "font-medium text-green-700 hover:underline"
    }
  >
    {status === "active" ? "Deactivate" : "Activate"}
  </button>
);

export interface LocationStatusTarget {
  id: string;
  name: string;
  status: LocationStatus;
}

interface LocationStatusModalProps {
  /** The location being changed; the modal is hidden while `null`. */
  target: LocationStatusTarget | null;
  onConfirm: (target: LocationStatusTarget) => void;
  onClose: () => void;
}

export const LocationStatusModal = ({ target, onConfirm, onClose }: LocationStatusModalProps) => {
  const deactivating = target?.status === "active";
  const verb = deactivating ? "Deactivate" : "Activate";

  return (
    <WebAppModal open={target !== null} onClose={onClose} title={target ? `${verb} ${target.name}?` : ""}>
      {target && (
        <>
          <p className="text-sm text-gray-600">
            This will make audience records in {target.name}{" "}
            {deactivating ? "unavailable" : "available"} for marketplace targeting.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <WebAppButton variant="outline" onClick={onClose}>
              Cancel
            </WebAppButton>
            <WebAppButton
              variant={deactivating ? "danger" : "primary"}
              onClick={() => {
                onConfirm(target);
                onClose();
              }}
            >
              {verb}
            </WebAppButton>
          </div>
        </>
      )}
    </WebAppModal>
  );
};
