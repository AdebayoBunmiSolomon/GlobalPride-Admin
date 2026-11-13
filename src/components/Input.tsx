import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

type InputSize = "sm" | "md" | "lg";

type InputVariant = "default" | "error";

interface WebAppInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Forwarded to the <input>, so `{...register("field")}` works. */
  ref?: Ref<HTMLInputElement>;

  label?: ReactNode;
  labelClassName?: string;
  required?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  loading?: boolean;
  loadingColor?: string;

  size?: InputSize;
  variant?: InputVariant;

  fullWidth?: boolean;

  containerClassName?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-3 text-sm",
  lg: "h-13 px-4 text-base",
};

export const WebAppInput = ({
  label,
  required = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  loading = false,
  loadingColor,
  size = "md",
  variant = "default",
  fullWidth = true,
  containerClassName,
  disabled,
  className,
  id,
  labelClassName,
  ...props
}: WebAppInputProps) => {
  const hasError = Boolean(error);
  const isDisabled = disabled || loading;

  return (
    <div className={cn(fullWidth && "w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 block text-sm font-medium",
            isDisabled ? "text-gray-400" : "text-gray-700",
            labelClassName,
          )}
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          required={required}
          disabled={isDisabled}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={cn(
            "w-full rounded-lg border bg-stone-50 text-gray-900",
            "outline-none focus:outline-none",
            "transition-colors duration-200",
            "placeholder:text-gray-400",
            "focus:ring-2",

            "disabled:cursor-not-allowed",
            "disabled:bg-stone-100",
            "disabled:text-gray-400",

            sizeStyles[size],

            leftIcon && "pl-10",
            (rightIcon || loading) && "pr-10",

            variant === "error" || hasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary focus:ring-primary/20",

            className,
          )}
          {...props}
        />

        {(rightIcon || loading) && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            {loading ? (
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ color: loadingColor }}
              />
            ) : (
              rightIcon
            )}
          </span>
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
};
