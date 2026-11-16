import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { WebAppButton } from "@/components/Button";
import { WebAppInput } from "@/components/Input";
import { WebAppModal } from "@/components/Modal";
import type { CampaignPrice, CampaignPriceKey } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import {
  referralBonusSchema,
  servicePriceSchema,
  vatRateSchema,
  type ReferralBonusValues,
  type ServicePriceValues,
  type VatRateValues,
} from "@/schemas/pricing";
import { updateCampaignPrice, updateReferralBonus, updateVatRate } from "@/store/pricingStore";
import { appToast } from "@/utils/appToast";
import { formatPrice } from "@/utils/format";
import { fieldError } from "./fieldError";

// Each modal is mounted only while open, so its form starts fresh every time.
// Saving calls the API; the modal stays open (with the API's error toasted) if it fails.

/** Runs a pricing update, toasts the result and closes the modal on success. */
const save = async (update: () => Promise<string | null | undefined>, fallbackMessage: string, onClose: () => void) => {
  try {
    const message = await update();
    appToast.show("Saved", message || fallbackMessage, "success");
    onClose();
  } catch (error) {
    handleApiError(error);
  }
};

interface ModalProps {
  onClose: () => void;
}

const CurrentValue = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="mb-4 flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3 text-sm">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export const ModalActions = ({
  onCancel,
  submitLabel = "Save Changes",
  submitting,
}: {
  onCancel: () => void;
  submitLabel?: string;
  submitting?: boolean;
}) => (
  <div className="flex justify-end gap-3 pt-2">
    <WebAppButton variant="outline" onClick={onCancel}>
      Cancel
    </WebAppButton>
    <WebAppButton type="submit" loading={submitting}>
      {submitLabel}
    </WebAppButton>
  </div>
);

const naira = <span className="text-sm text-gray-500">₦</span>;

export const EditServicePriceModal = ({ service, onClose }: ModalProps & { service: CampaignPrice }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServicePriceValues>({ resolver: yupResolver(servicePriceSchema) });

  const onSubmit = ({ price }: ServicePriceValues) =>
    save(() => updateCampaignPrice(service.key as CampaignPriceKey, price), "Price updated.", onClose);

  return (
    <WebAppModal open onClose={onClose} title={`Edit ${service.name} Pricing`}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <CurrentValue
          label="Current Price"
          value={service.price === null ? "—" : formatPrice(service.price, { fixed: true })}
        />
        <WebAppInput
          id="servicePrice"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          label="New Price"
          placeholder="0.00"
          leftIcon={naira}
          autoFocus
          error={fieldError(errors.price?.message)}
          {...register("price")}
        />
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
          <span className="text-gray-600">Pricing Unit</span>
          <span className="font-medium text-gray-900 first-letter:uppercase">{service.unit || "—"}</span>
        </div>
        <ModalActions onCancel={onClose} submitting={isSubmitting} />
      </form>
    </WebAppModal>
  );
};

export const EditVatModal = ({ currentRate, onClose }: ModalProps & { currentRate: number }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VatRateValues>({ resolver: yupResolver(vatRateSchema) });

  const onSubmit = ({ rate }: VatRateValues) => save(() => updateVatRate(rate), "VAT rate updated.", onClose);

  return (
    <WebAppModal open onClose={onClose} title="Edit VAT Rate">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <CurrentValue label="Current Rate" value={`${currentRate}%`} />
        <WebAppInput
          id="vatRate"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max="100"
          label="New Rate"
          placeholder="0"
          rightIcon={<span className="text-sm text-gray-500">%</span>}
          autoFocus
          error={fieldError(errors.rate?.message)}
          {...register("rate")}
        />
        <ModalActions onCancel={onClose} submitting={isSubmitting} />
      </form>
    </WebAppModal>
  );
};

/** Only the amount can be changed; the reward type (wallet credit) and trigger are fixed by the API. */
export const EditReferralBonusModal = ({ currentAmount, onClose }: ModalProps & { currentAmount: number }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReferralBonusValues>({
    resolver: yupResolver(referralBonusSchema),
    defaultValues: { amount: currentAmount },
  });

  const onSubmit = ({ amount }: ReferralBonusValues) =>
    save(() => updateReferralBonus(amount), "Referral bonus updated.", onClose);

  return (
    <WebAppModal open onClose={onClose} title="Edit Referral Bonus">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <CurrentValue label="Current Bonus" value={formatPrice(currentAmount)} />
        <WebAppInput
          id="referralAmount"
          type="number"
          inputMode="decimal"
          min="0"
          label="Bonus Amount"
          placeholder="0"
          leftIcon={naira}
          autoFocus
          helperText="Credited to the referrer's wallet for each successful referral."
          error={fieldError(errors.amount?.message)}
          {...register("amount")}
        />
        <ModalActions onCancel={onClose} submitting={isSubmitting} />
      </form>
    </WebAppModal>
  );
};
