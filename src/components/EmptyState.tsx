import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type EmptyStateSize = "sm" | "md" | "lg";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface WebAppEmptyStateProps {
  icon?: ReactNode;

  title: ReactNode;
  description?: ReactNode;

  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;

  size?: EmptyStateSize;

  className?: string;
  containerClassName?: string;
}

const iconWrapperSizeStyles: Record<EmptyStateSize, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-18 w-18",
};

const titleSizeStyles: Record<EmptyStateSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const descriptionSizeStyles: Record<EmptyStateSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

const paddingSizeStyles: Record<EmptyStateSize, string> = {
  sm: "py-8 px-4",
  md: "py-12 px-6",
  lg: "py-16 px-8",
};

export const WebAppEmptyState = ({
  icon,

  title,
  description,

  primaryAction,
  secondaryAction,

  size = "md",

  className,
  containerClassName,
}: WebAppEmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        paddingSizeStyles[size],
        containerClassName,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 flex shrink-0 items-center justify-center rounded-full",
            "bg-gray-50 text-gray-400",
            iconWrapperSizeStyles[size],
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-gray-900",
          titleSizeStyles[size],
          className,
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "mt-1.5 max-w-sm text-gray-500",
            descriptionSizeStyles[size],
          )}
        >
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex items-center gap-3">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cn(
                "rounded-lg border border-gray-300 bg-white",
                "px-4 py-2 text-sm font-medium text-gray-700",
                "transition-colors hover:bg-gray-50",
              )}
            >
              {secondaryAction.label}
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={cn(
                "rounded-lg bg-primary",
                "px-4 py-2 text-sm font-medium text-white",
                "transition-colors hover:bg-primary/90",
              )}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
