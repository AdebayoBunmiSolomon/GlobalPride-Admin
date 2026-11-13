import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { WebAppButton } from "@/components/Button";
import { WebAppInput } from "@/components/Input";
import { WebAppModal } from "@/components/Modal";
import { WebAppSelectInput } from "@/components/Select";
import { usePricing } from "@/hooks/usePricing";
import {
  referralBonusSchema,
  servicePriceSchema,
  vatRateSchema,
  type ReferralBonusValues,
  type ServicePriceValues,
  type VatRateValues,
} from "@/schemas/pricing";
import type { ServicePrice } from "@/types/pricing";
import { formatPrice } from "@/utils/format";
import { fieldError } from "./fieldError";
import { referralStatusOptions, rewardTypeOptions, triggerOptions } from "./pricingOptions";

// Each modal is mounted only while open, so its form starts fresh every time.

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
    <WebAppButton type="submit" disabled={submitting}>
      {submitLabel}
    </WebAppButton>
  </div>
);

const naira = <span className="text-sm text-gray-500">₦</span>;

export const EditServicePriceModal = ({ service, onClose }: ModalProps & { service: ServicePrice }) => {
  const setServicePrice = usePricing((state) => state.setServicePrice);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServicePriceValues>({ resolver: yupResolver(servicePriceSchema) });

  // TODO: send to the API once the pricing endpoint is available.
  const onSubmit = ({ price }: ServicePriceValues) => {
    setServicePrice(service.id, price);
    onClose();
  };

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
          <span className="font-medium text-gray-900">{service.unit}</span>
        </div>
        <ModalActions onCancel={onClose} submitting={isSubmitting} />
      </form>
    </WebAppModal>
  );
};

export const EditVatModal = ({ onClose }: ModalProps) => {
  const { vatRate, setVatRate } = usePricing();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VatRateValues>({ resolver: yupResolver(vatRateSchema) });

  // TODO: send to the API once the VAT endpoint is available.
  const onSubmit = ({ rate }: VatRateValues) => {
    setVatRate(rate);
    onClose();
  };

  return (
    <WebAppModal open onClose={onClose} title="Edit VAT Rate">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <CurrentValue label="Current Rate" value={`${vatRate}%`} />
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

export const EditReferralBonusModal = ({ onClose }: ModalProps) => {
  const { referralBonus, setReferralBonus } = usePricing();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReferralBonusValues>({
    resolver: yupResolver(referralBonusSchema),
    defaultValues: referralBonus,
  });

  // TODO: send to the API once the referral settings endpoint is available.
  const onSubmit = (values: ReferralBonusValues) => {
    setReferralBonus(values);
    onClose();
  };

  return (
    <WebAppModal open onClose={onClose} title="Edit Referral Bonus">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppInput
          id="referralAmount"
          type="number"
          inputMode="decimal"
          min="0"
          label="Bonus Amount"
          placeholder="0"
          leftIcon={naira}
          error={fieldError(errors.amount?.message)}
          {...register("amount")}
        />
        <Controller
          control={control}
          name="rewardType"
          render={({ field }) => (
            <WebAppSelectInput
              id="referralRewardType"
              label="Reward Type"
              options={rewardTypeOptions}
              value={field.value}
              onChange={field.onChange}
              className="bg-stone-50"
            />
          )}
        />
        <Controller
          control={control}
          name="trigger"
          render={({ field }) => (
            <WebAppSelectInput
              id="referralTrigger"
              label="Trigger"
              options={triggerOptions}
              value={field.value}
              onChange={field.onChange}
              className="bg-stone-50"
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <WebAppSelectInput
              id="referralStatus"
              label="Status"
              options={referralStatusOptions}
              value={field.value}
              onChange={field.onChange}
              className="bg-stone-50"
            />
          )}
        />
        <ModalActions onCancel={onClose} submitting={isSubmitting} />
      </form>
    </WebAppModal>
  );
};
