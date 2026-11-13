import { useState } from "react";
import { Plus, Tag } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { usePricing } from "@/hooks/usePricing";
import type { Promotion } from "@/types/pricing";
import { formatDateOnly } from "@/utils/format";
import { StatusBadge } from "./PricingBadges";
import { formatDiscount, promotionStatusStyles, promotionTargetLabels } from "./pricingOptions";
import { PromotionModal } from "./PromotionModal";

/** `undefined` = closed, `null` = creating, a promotion = editing it. */
type ModalState = Promotion | null | undefined;

export const Promotions = () => {
  const promotions = usePricing((state) => state.promotions);
  const [modal, setModal] = useState<ModalState>(undefined);

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
          <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModal(null)}>
            Create Promotion
          </WebAppButton>
        }
      />

      <WebAppCard
        divided
        title="Promotions"
        description={`${promotions.length} ${promotions.length === 1 ? "promotion" : "promotions"}`}
        bodyClassName="p-0"
      >
        {promotions.length === 0 ? (
          <WebAppEmptyState
            icon={<Tag className="h-6 w-6" />}
            title="No promotions yet"
            description="Create a promotion to offer a temporary discount."
            primaryAction={{ label: "Create Promotion", onClick: () => setModal(null) }}
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
                {promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{promotion.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDiscount(promotion)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{promotionTargetLabels[promotion.appliesTo]}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge style={promotionStatusStyles[promotion.status]} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDateOnly(promotion.startDate)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{formatDateOnly(promotion.endDate)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setModal(promotion)}
                        aria-label={`Edit ${promotion.name}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Edit
                      </button>
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
    </div>
  );
};
