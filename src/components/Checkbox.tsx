import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/utils/cn";

type CheckboxSize = "sm" | "md" | "lg";

interface WebAppCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  label?: ReactNode;
  labelClassName?: string;
  description?: ReactNode;

  error?: ReactNode;
  helperText?: ReactNode;

  /**
   * Visual "partially selected" state, e.g. a parent checkbox for a
   * group where some but not all children are checked. This is a DOM
   * property, not an HTML attribute, so React can't set it via props —
   * it has to be applied imperatively to the node.
   */
  indeterminate?: boolean;

  size?: CheckboxSize;

  containerClassName?: string;
}

const boxSizeStyles: Record<CheckboxSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const iconSizeStyles: Record<CheckboxSize, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

const labelSizeStyles: Record<CheckboxSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const WebAppCheckbox = forwardRef<HTMLInputElement, WebAppCheckboxProps>(
  (
    {
      label,
      labelClassName,
      description,

      error,
      helperText,

      indeterminate = false,

      size = "md",

      containerClassName,

      disabled,
      className,
      id,
      checked,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);

    const hasError = Boolean(error);
    const isDisabled = disabled;

    /**
     * Sync the indeterminate DOM property. This is a genuine effect
     * use case: `indeterminate` has no corresponding JSX attribute,
     * so the only way to express it is imperatively on the node —
     * this isn't state-syncing that could be done at the callsite.
     */
    useEffect(() => {
      const node = internalRef.current;

      if (!node) {
        return;
      }

      node.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <div className={cn("w-full", containerClassName)}>
        <div className="flex items-start gap-2.5">
          <div className="relative flex shrink-0 items-center justify-center">
            <input
              ref={(node) => {
                internalRef.current = node;

                if (typeof forwardedRef === "function") {
                  forwardedRef(node);
                } else if (forwardedRef) {
                  forwardedRef.current = node;
                }
              }}
              type="checkbox"
              id={id}
              disabled={isDisabled}
              checked={checked}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${id}-error` : helperText ? `${id}-helper` : undefined
              }
              className={cn(
                "peer appearance-none rounded border bg-white",
                "outline-none focus:outline-none",
                "transition-colors duration-200",
                "cursor-pointer disabled:cursor-not-allowed",

                boxSizeStyles[size],

                "border-gray-300",
                "checked:border-primary checked:bg-primary",
                "indeterminate:border-primary indeterminate:bg-primary",
                "focus-visible:ring-2 focus-visible:ring-primary/30",

                hasError &&
                  "border-red-500 checked:border-red-500 checked:bg-red-500 indeterminate:border-red-500 indeterminate:bg-red-500 focus-visible:ring-red-500/30",

                isDisabled &&
                  "border-gray-200 bg-gray-50 checked:bg-gray-300 checked:border-gray-300",

                className,
              )}
              {...props}
            />

            {/* Custom check / dash icon, shown via peer state */}
            <span
              className={cn(
                "pointer-events-none absolute inset-0 items-center justify-center text-white",
                // `peer-checked` covers uncontrolled use (e.g. react-hook-form's register).
                checked || indeterminate ? "flex" : "hidden peer-checked:flex",
              )}
              aria-hidden="true"
            >
              {indeterminate ? (
                <Minus
                  className={iconSizeStyles[size]}
                  strokeWidth={3}
                />
              ) : (
                <Check
                  className={iconSizeStyles[size]}
                  strokeWidth={3}
                />
              )}
            </span>
          </div>

          {(label || description) && (
            <div className="flex-1">
              {label && (
                <label
                  htmlFor={id}
                  className={cn(
                    "block font-medium leading-none",
                    labelSizeStyles[size],
                    isDisabled ? "text-gray-400" : "text-gray-700",
                    !isDisabled && "cursor-pointer",
                    labelClassName,
                  )}
                >
                  {label}
                </label>
              )}

              {description && (
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isDisabled ? "text-gray-300" : "text-gray-500",
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${id}-helper`} className="mt-1.5 text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

WebAppCheckbox.displayName = "WebAppCheckbox";
