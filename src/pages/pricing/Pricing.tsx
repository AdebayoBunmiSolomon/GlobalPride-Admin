import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CircleAlert, RefreshCw, Tag } from "lucide-react";

import type { CampaignPrice } from "@/api/types/response";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { usePricingSettings } from "@/store/pricingStore";
import { usePromotions } from "@/store/promotionsStore";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";
import { StatusBadge } from "./PricingBadges";
import { EditReferralBonusModal, EditServicePriceModal, EditVatModal } from "./PricingModals";
import { rewardTypeLabel, servicePriceStatusStyles, triggerLabel } from "./pricingOptions";

type OpenModal = { kind: "service"; service: CampaignPrice } | { kind: "vat" } | { kind: "referral" } | null;

const breadcrumbs = [{ label: "Dashboard", to: "/dashboard" }, { label: "Pricing Management" }];

const EditButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="text-sm font-medium text-primary hover:underline"
  >
    Edit
  </button>
);

export const Pricing = () => {
  const { data: promotions } = usePromotions();
  const { data: pricing, error, loading, refresh } = usePricingSettings();
  const [modal, setModal] = useState<OpenModal>(null);
  const closeModal = () => setModal(null);

  const activePromotions = promotions?.filter((promotion) => promotion.status === "active").length;

  const header = (
    <WebAppPageHeader
      title="Pricing Management"
      description="Manage platform pricing, VAT and referral rewards."
      breadcrumbs={breadcrumbs}
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh pricing"
          title="Refresh"
          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      }
    />
  );

  if (!pricing) {
    return (
      <div className="space-y-6">
        {header}
        {error ? (
          <WebAppCard>
            <WebAppEmptyState
              icon={<CircleAlert className="h-6 w-6" />}
              title="Couldn't load pricing"
              description={error.message}
              primaryAction={{ label: "Try again", onClick: refresh }}
            />
          </WebAppCard>
        ) : (
          <div className="space-y-6" aria-busy={loading} aria-label="Loading pricing">
            <div className="h-80 animate-pulse rounded-xl bg-gray-100" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const { campaignPricing, vat, referralBonus } = pricing;

  return (
    <div className="space-y-6">
      {header}

      <WebAppCard
        divided
        title="Campaign Pricing"
        description="Manage current platform pricing."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Service</th>
                <th scope="col" className="px-5 py-3 font-semibold">Current Price</th>
                <th scope="col" className="px-5 py-3 font-semibold">Unit</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaignPricing.map((service) => {
                const editable = service.status === "active";

                return (
                  <tr key={service.key} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{service.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {service.price === null ? "—" : formatPrice(service.price)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 first-letter:uppercase">{service.unit || "—"}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge style={servicePriceStatusStyles[service.status]} />
                    </td>
                    <td className="px-5 py-3.5">
                      {editable ? (
                        <EditButton
                          label={`Edit ${service.name} pricing`}
                          onClick={() => setModal({ kind: "service", service })}
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WebAppCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <WebAppCard
          title="VAT"
          description="Applied to applicable platform charges."
          action={<EditButton label="Edit VAT rate" onClick={() => setModal({ kind: "vat" })} />}
        >
          <div className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-4">
            <span className="text-sm text-gray-600">Current VAT Rate</span>
            <span className="text-xl font-semibold text-gray-900">{vat.ratePercent}%</span>
          </div>
        </WebAppCard>

        <WebAppCard
          title="Referral Bonus"
          action={<EditButton label="Edit referral bonus" onClick={() => setModal({ kind: "referral" })} />}
          bodyClassName="pt-2"
        >
          <WebAppDetailList
            align="right"
            items={[
              { label: "Bonus Amount", value: formatPrice(referralBonus.amount) },
              { label: "Reward Type", value: rewardTypeLabel(referralBonus.rewardType) },
              { label: "Trigger", value: triggerLabel(referralBonus.trigger) },
            ]}
          />
        </WebAppCard>
      </div>

      <WebAppCard
        title="Promotions"
        description="Manage temporary pricing offers and discounts."
        action={
          <Link
            to="/pricing/promotions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Manage Promotions
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="flex items-center gap-4 rounded-lg bg-stone-50 px-4 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm text-gray-600">Active Promotions</p>
            <p className="text-lg font-semibold text-gray-900">{activePromotions ?? "…"}</p>
          </div>
        </div>
      </WebAppCard>

      {modal?.kind === "service" && <EditServicePriceModal service={modal.service} onClose={closeModal} />}
      {modal?.kind === "vat" && <EditVatModal currentRate={vat.ratePercent} onClose={closeModal} />}
      {modal?.kind === "referral" && (
        <EditReferralBonusModal currentAmount={referralBonus.amount} onClose={closeModal} />
      )}
    </div>
  );
};
