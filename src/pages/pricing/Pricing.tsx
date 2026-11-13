import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppPageHeader } from "@/components/PageHeader";
import { usePricing } from "@/hooks/usePricing";
import type { ServicePrice } from "@/types/pricing";
import { formatPrice } from "@/utils/format";
import { StatusBadge } from "./PricingBadges";
import { EditReferralBonusModal, EditServicePriceModal, EditVatModal } from "./PricingModals";
import {
  referralStatusStyles,
  rewardTypeLabels,
  servicePriceStatusStyles,
  triggerLabels,
} from "./pricingOptions";

type OpenModal = { kind: "service"; service: ServicePrice } | { kind: "vat" } | { kind: "referral" } | null;

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
  const { services, vatRate, referralBonus, promotions } = usePricing();
  const [modal, setModal] = useState<OpenModal>(null);
  const closeModal = () => setModal(null);

  const activePromotions = promotions.filter((promotion) => promotion.status === "active").length;

  return (
    <div className="space-y-6">
      <WebAppPageHeader
        title="Pricing Management"
        description="Manage platform pricing, VAT and referral rewards."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Pricing Management" }]}
      />

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
              {services.map((service) => {
                const editable = service.status === "active";

                return (
                  <tr key={service.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{service.name}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {service.price === null ? "—" : formatPrice(service.price)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{service.unit}</td>
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
            <span className="text-xl font-semibold text-gray-900">{vatRate}%</span>
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
              { label: "Reward Type", value: rewardTypeLabels[referralBonus.rewardType] },
              { label: "Trigger", value: triggerLabels[referralBonus.trigger] },
              { label: "Status", value: <StatusBadge style={referralStatusStyles[referralBonus.status]} /> },
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
            <p className="text-lg font-semibold text-gray-900">{activePromotions}</p>
          </div>
        </div>
      </WebAppCard>

      {modal?.kind === "service" && <EditServicePriceModal service={modal.service} onClose={closeModal} />}
      {modal?.kind === "vat" && <EditVatModal onClose={closeModal} />}
      {modal?.kind === "referral" && <EditReferralBonusModal onClose={closeModal} />}
    </div>
  );
};
