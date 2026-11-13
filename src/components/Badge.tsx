import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type BadgeVariant = "primary" | "success" | "info" | "warning" | "danger" | "neutral";

interface WebAppBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Show a small colored dot before the label. */
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-50 text-gray-700",
  info: "bg-blue-50 text-gray-700",
  warning: "bg-amber-50 text-gray-700",
  danger: "bg-red-50 text-gray-700",
  neutral: "bg-gray-100 text-gray-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  primary: "bg-primary",
  success: "bg-green-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-gray-400",
};

export const WebAppBadge = ({
  children,
  variant = "neutral",
  dot = false,
  icon,
  className,
}: WebAppBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      variantStyles[variant],
      className,
    )}
  >
    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} />}
    {icon}
    {children}
  </span>
);
