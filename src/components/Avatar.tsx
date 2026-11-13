import { cn } from "@/utils/cn";

type AvatarSize = "sm" | "md" | "lg";
type AvatarVariant = "solid" | "soft";

interface WebAppAvatarProps {
  name: string;
  size?: AvatarSize;
  /** `solid`: white on violet. `soft`: primary text on a light tint. */
  variant?: AvatarVariant;
  className?: string;
}

const variantStyles: Record<AvatarVariant, string> = {
  solid: "bg-violet-700 text-white",
  soft: "bg-primary/10 text-primary",
};

/** "Sarah Ade" → "SA", "Admin" → "A". */
const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
};

export const WebAppAvatar = ({
  name,
  size = "md",
  variant = "solid",
  className,
}: WebAppAvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
      variantStyles[variant],
      sizeStyles[size],
      className,
    )}
  >
    {getInitials(name)}
  </span>
);
