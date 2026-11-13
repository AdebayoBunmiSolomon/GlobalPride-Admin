import { useId, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface WebAppSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** On / off toggle. With a `label`, renders as a full-width row with the switch on the right. */
export const WebAppSwitch = ({ checked, onChange, label, description, disabled = false, className }: WebAppSwitchProps) => {
  const labelId = useId();
  const descriptionId = useId();

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors",
        "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-gray-300",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.75",
        )}
      />
    </button>
  );

  if (!label) return <span className={className}>{toggle}</span>;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium text-gray-900">
          {label}
        </p>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-xs text-gray-600">
            {description}
          </p>
        )}
      </div>
      {toggle}
    </div>
  );
};
