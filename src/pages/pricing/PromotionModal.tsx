import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { WebAppInput } from "@/components/Input";
import { WebAppModal } from "@/components/Modal";
import { WebAppSelectInput } from "@/components/Select";
import { usePricing } from "@/hooks/usePricing";
import { promotionSchema, type PromotionValues } from "@/schemas/pricing";
import type { Promotion } from "@/types/pricing";
import { fieldError } from "./fieldError";
import { ModalActions } from "./PricingModals";
import { discountTypeOptions, promotionStatusOptions, promotionTargetOptions } from "./pricingOptions";

interface PromotionModalProps {
  /** Omit to create a new promotion. */
  promotion?: Promotion;
  onClose: () => void;
}

const newPromotion: Partial<PromotionValues> = {
  name: "",
  discountType: "percentage",
  appliesTo: "sms",
  startDate: "",
  endDate: "",
  status: "active",
};

/** Create / edit promotion form. Mount only while open so the form starts fresh. */
export const PromotionModal = ({ promotion, onClose }: PromotionModalProps) => {
  const { createPromotion, updatePromotion } = usePricing();
  const isEdit = Boolean(promotion);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PromotionValues>({
    resolver: yupResolver(promotionSchema),
    defaultValues: promotion ?? newPromotion,
  });

  const isPercentage = useWatch({ control, name: "discountType" }) === "percentage";

  // TODO: send to the API once the promotions endpoint is available.
  const onSubmit = (values: PromotionValues) => {
    if (promotion) updatePromotion(promotion.id, values);
    else createPromotion(values);
    onClose();
  };

  const unit = <span className="text-sm text-gray-500">{isPercentage ? "%" : "₦"}</span>;

  return (
    <WebAppModal open onClose={onClose} title={isEdit ? "Edit Promotion" : "Create Promotion"} className="max-w-lg">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <WebAppInput
          id="promotionName"
          label="Promotion Name"
          placeholder="e.g. Welcome Bonus"
          autoFocus={!isEdit}
          error={fieldError(errors.name?.message)}
          {...register("name")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <WebAppSelectInput
                id="promotionDiscountType"
                label="Discount Type"
                options={discountTypeOptions}
                value={field.value}
                onChange={field.onChange}
                className="bg-stone-50"
              />
            )}
          />
          <WebAppInput
            id="promotionDiscountValue"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            label="Discount Value"
            placeholder="0"
            leftIcon={isPercentage ? undefined : unit}
            rightIcon={isPercentage ? unit : undefined}
            error={fieldError(errors.discountValue?.message)}
            {...register("discountValue")}
          />
        </div>

        <Controller
          control={control}
          name="appliesTo"
          render={({ field }) => (
            <WebAppSelectInput
              id="promotionAppliesTo"
              label="Applies To"
              options={promotionTargetOptions}
              value={field.value}
              onChange={field.onChange}
              className="bg-stone-50"
            />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <WebAppInput
            id="promotionStartDate"
            type="date"
            label="Start Date"
            error={fieldError(errors.startDate?.message)}
            {...register("startDate")}
          />
          <WebAppInput
            id="promotionEndDate"
            type="date"
            label="End Date"
            error={fieldError(errors.endDate?.message)}
            {...register("endDate")}
          />
        </div>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <WebAppSelectInput
              id="promotionStatus"
              label="Status"
              options={promotionStatusOptions}
              value={field.value}
              onChange={field.onChange}
              className="bg-stone-50"
            />
          )}
        />

        <ModalActions
          onCancel={onClose}
          submitting={isSubmitting}
          submitLabel={isEdit ? "Save Changes" : "Create Promotion"}
        />
      </form>
    </WebAppModal>
  );
};
