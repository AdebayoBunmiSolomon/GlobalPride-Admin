import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/utils/cn";

type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "body-sm"
  | "caption"
  | "label";

type TextColor =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger";

type TextWeight = "normal" | "medium" | "semibold" | "bold";

type TextAlign = "left" | "center" | "right";

interface TextProps extends ComponentPropsWithoutRef<"p"> {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  align?: TextAlign;
  as?: ElementType;
  truncate?: boolean;
}

const variantStyles: Record<TextVariant, string> = {
  display: "text-4xl leading-tight",
  h1: "text-3xl leading-tight",
  h2: "text-2xl leading-tight",
  h3: "text-xl leading-snug",
  h4: "text-lg leading-snug",
  body: "text-base leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  caption: "text-xs leading-normal",
  label: "text-sm leading-normal",
};

const colorStyles: Record<TextColor, string> = {
  default: "text-gray-900",
  muted: "text-gray-500",
  primary: "text-primary",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
};

const weightStyles: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const alignStyles: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const WebAppText = ({
  variant = "body",
  color = "default",
  weight = "normal",
  align = "left",
  as: Component = "p",
  truncate = false,
  className,
  ...props
}: TextProps) => {
  return (
    <Component
      className={cn(
        variantStyles[variant],
        colorStyles[color],
        weightStyles[weight],
        alignStyles[align],
        truncate && "truncate",
        className,
      )}
      {...props}
    />
  );
};
