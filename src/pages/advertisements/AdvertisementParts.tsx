import { useNavigate } from "react-router-dom";
import { CircleAlert, Image, ImageOff } from "lucide-react";

import type { AdminAdvertisement, ApiError, AdvertisementStatus } from "@/api/types/response";
import { WebAppBadge } from "@/components/Badge";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { cn } from "@/utils/cn";
import { advertisementStatusStyles, backToAdvertisements } from "./advertisementOptions";

export const AdvertisementStatusBadge = ({ status }: { status: AdvertisementStatus }) => {
  const style = advertisementStatusStyles[status];
  return (
    <WebAppBadge dot variant={style.variant} className={style.className}>
      {style.label}
    </WebAppBadge>
  );
};

/** List thumbnail; falls back to an icon tile when there is no creative. */
export const AdThumbnail = ({ src, className }: { src?: string | null; className?: string }) => (
  <span
    className={cn(
      "flex h-9 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-stone-100 text-gray-400",
      className,
    )}
  >
    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <Image className="h-4 w-4" />}
  </span>
);

interface AdCreativeCardProps {
  creative?: string | null;
  advertiser?: string;
  ctaLabel?: string;
  className?: string;
}

/** The ad as it appears in the app's Home Feed slot. */
export const AdCreativeCard = ({ creative, advertiser, ctaLabel, className }: AdCreativeCardProps) => (
  <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
    <div className="relative aspect-2/1 bg-stone-100">
      {creative ? (
        <img src={creative} alt="Advertisement creative" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
          <ImageOff className="h-5 w-5" />
          <span className="text-[11px]">No creative uploaded</span>
        </div>
      )}
      <span className="absolute top-2 left-2 rounded-full bg-gray-900/75 px-2 py-0.5 text-[10px] font-medium text-white">
        Sponsored
      </span>
    </div>
    <div className="p-3">
      <p className="truncate text-sm font-semibold text-gray-900">{advertiser?.trim() || "Advertiser name"}</p>
      <p className="text-xs text-gray-500">Promoted content</p>
      <span className="mt-3 flex h-8 items-center justify-center truncate rounded-md bg-primary px-3 text-xs font-medium text-white">
        {ctaLabel?.trim() || "Learn More"}
      </span>
    </div>
  </div>
);

interface ConfirmModalProps {
  /** The ad to act on; the modal is closed while this is undefined. */
  advertisement?: AdminAdvertisement;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (advertisement: AdminAdvertisement) => void;
}

const ConfirmModal = ({
  advertisement,
  busy,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
}: ConfirmModalProps & { title: string; body: string; confirmLabel: string }) => (
  <WebAppModal open={Boolean(advertisement)} onClose={onClose} title={title}>
    {advertisement && (
      <>
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{advertisement.name}</span> ({advertisement.code}) {body}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <WebAppButton variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </WebAppButton>
          <WebAppButton variant="danger" loading={busy} onClick={() => onConfirm(advertisement)}>
            {confirmLabel}
          </WebAppButton>
        </div>
      </>
    )}
  </WebAppModal>
);

export const EndAdvertisementModal = (props: ConfirmModalProps) => (
  <ConfirmModal
    {...props}
    title="End advertisement?"
    body="will stop displaying in the app immediately. Ended advertisements can't be resumed or edited; they are kept for reference."
    confirmLabel="End Advertisement"
  />
);

export const DeleteAdvertisementModal = (props: ConfirmModalProps) => (
  <ConfirmModal
    {...props}
    title="Delete advertisement?"
    body="will be permanently removed, along with its creative. This can't be undone."
    confirmLabel="Delete Advertisement"
  />
);

interface AdvertisementLoadStateProps {
  breadcrumbs: { label: string; to?: string }[];
  error: ApiError | null;
  loading: boolean;
  onRetry: () => void;
}

/** Shown while an advertisement loads, or when it couldn't be loaded / doesn't exist. */
export const AdvertisementLoadState = ({ breadcrumbs, error, loading, onRetry }: AdvertisementLoadStateProps) => {
  const navigate = useNavigate();
  const notFound = error?.status === 404 || error?.status === 400;

  return (
    <div>
      <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backToAdvertisements} />
      {error ? (
        <WebAppCard>
          <WebAppEmptyState
            icon={notFound ? <Image className="h-6 w-6" /> : <CircleAlert className="h-6 w-6" />}
            title={notFound ? "Advertisement not found" : "Couldn't load this advertisement"}
            description={notFound ? "This advertisement doesn't exist, or the link is incorrect." : error.message}
            primaryAction={
              notFound
                ? { label: "Back to Advertisement Management", onClick: () => navigate("/advertisements") }
                : { label: "Try again", onClick: onRetry }
            }
          />
        </WebAppCard>
      ) : (
        <div className="space-y-4" aria-busy={loading} aria-label="Loading advertisement">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}
    </div>
  );
};
