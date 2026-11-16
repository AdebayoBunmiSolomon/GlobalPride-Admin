import { useMemo, useState } from "react";
import { CircleAlert, Pencil, Plus, Tag, Trash2 } from "lucide-react";

import { handleApiError } from "@/api/utils";
import { WebAppActionMenu } from "@/components/ActionMenu";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppModal } from "@/components/Modal";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import { useListParams } from "@/hooks/useListParams";
import { RefreshButton } from "@/pages/shared/RefreshButton";
import { deletePromotion, usePromotions } from "@/store/promotionsStore";
import type { Promotion } from "@/types/pricing";
import { appToast } from "@/utils/appToast";
import { formatDateOnly } from "@/utils/format";
import { StatusBadge } from "./PricingBadges";
import {
  formatDiscount,
  promotionStatusFilterOptions,
  promotionStatusStyles,
  promotionTargetFilterOptions,
  promotionTargetLabels,
} from "./pricingOptions";
import { PromotionModal } from "./PromotionModal";

/** `undefined` = closed, `null` = creating, a promotion = editing it. */
type ModalState = Promotion | null | undefined;

const statusRank = { active: 0, scheduled: 1, expired: 2 } as const;

export const Promotions = () => {
  const { get, update } = useListParams({ status: "all", appliesTo: "all" });
  const status = get("status");
  const appliesTo = get("appliesTo");
  const { data: promotions, error, loading, refresh } = usePromotions();
  const [modal, setModal] = useState<ModalState>(undefined);
  const [deleting, setDeleting] = useState<Promotion>();
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      (promotions ?? [])
        .filter(
          (promotion) =>
            (status === "all" || promotion.status === status) &&
            (appliesTo === "all" || promotion.appliesTo === appliesTo),
        )
        .sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.startDate.localeCompare(a.startDate)),
    [promotions, status, appliesTo],
  );

  const confirmDelete = async (promotion: Promotion) => {
    setBusy(true);
    try {
      const { message } = await deletePromotion(promotion);
      appToast.show("Promotion deleted", message || `${promotion.name} was removed. Prices are back to normal.`, "success");
      setDeleting(undefined);
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: "We couldn't delete this promotion." });
    } finally {
      setBusy(false);
    }
  };

  const total = promotions?.length ?? 0;

  return (
    <div>
      <WebAppPageHeader
        title="Promotions"
        description="Create and manage promotional pricing offers."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Pricing Management", to: "/pricing" },
          { label: "Promotions" },
        ]}
        backLink={{ label: "Back to Pricing", to: "/pricing" }}
        actions={
          <>
            <RefreshButton label="Refresh promotions" loading={loading} onClick={() => void refresh()} />
            <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal(null)}>
              Create Promotion
            </WebAppButton>
          </>
        }
      />

      <WebAppCard
        divided
        title="Promotions"
        description={
          !promotions
            ? undefined
            : filtered.length === total
              ? `${total} ${total === 1 ? "promotion" : "promotions"}`
              : `${filtered.length} of ${total} promotions`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <WebAppSelectInput
              id="promotionStatusFilter"
              aria-label="Filter by status"
              options={promotionStatusFilterOptions}
              value={status}
              onChange={(value) => update({ status: value })}
              fullWidth={false}
              containerClassName="w-40"
            />
            <WebAppSelectInput
              id="promotionTargetFilter"
              aria-label="Filter by service"
              options={promotionTargetFilterOptions}
              value={appliesTo}
              onChange={(value) => update({ appliesTo: value })}
              fullWidth={false}
              containerClassName="w-44"
            />
          </div>
        }
        bodyClassName="p-0"
      >
        {!promotions ? (
          error ? (
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load promotions"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: () => void refresh() }}
            />
          ) : (
            <div className="space-y-3 p-5" aria-busy="true" aria-label="Loading promotions">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <WebAppEmptyState
            icon={<Tag className="h-6 w-6" />}
            title={total === 0 ? "No promotions yet" : "No promotions match these filters"}
            description={total === 0 ? "Create a promotion to offer a temporary discount." : "Try a different filter."}
            primaryAction={total === 0 ? { label: "Create Promotion", onClick: () => setModal(null) } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Promotion</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Discount</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Applies To</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Start Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">End Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{promotion.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDiscount(promotion)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{promotionTargetLabels[promotion.appliesTo]}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge style={promotionStatusStyles[promotion.status]} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {promotion.startDate ? formatDateOnly(promotion.startDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {promotion.endDate ? formatDateOnly(promotion.endDate) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <WebAppActionMenu
                        label={`Actions for ${promotion.name}`}
                        className="ml-3"
                        items={[
                          { label: "Edit", icon: Pencil, onSelect: () => setModal(promotion) },
                          { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(promotion) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WebAppCard>

      {modal !== undefined && (
        <PromotionModal promotion={modal ?? undefined} onClose={() => setModal(undefined)} />
      )}

      <WebAppModal open={Boolean(deleting)} onClose={() => setDeleting(undefined)} title="Delete promotion?">
        {deleting && (
          <>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{deleting.name}</span> will be removed and prices go back to
              normal straight away.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <WebAppButton variant="outline" onClick={() => setDeleting(undefined)} disabled={busy}>
                Cancel
              </WebAppButton>
              <WebAppButton variant="danger" loading={busy} onClick={() => void confirmDelete(deleting)}>
                Delete
              </WebAppButton>
            </div>
          </>
        )}
      </WebAppModal>
    </div>
  );
};
