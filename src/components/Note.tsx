import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type NoteTone = "neutral" | "success" | "warning" | "danger";

interface WebAppNoteProps {
  icon?: ReactNode;
  tone?: NoteTone;
  children: ReactNode;
  className?: string;
}

const toneStyles: Record<NoteTone, { box: string; icon: string }> = {
  neutral: { box: "bg-stone-50 text-gray-600", icon: "text-gray-500" },
  success: { box: "bg-green-50 text-green-800", icon: "text-green-700" },
  warning: { box: "bg-amber-50 text-amber-800", icon: "text-amber-700" },
  danger: { box: "bg-red-50 text-red-800", icon: "text-red-600" },
};

/** Small tinted callout with an optional leading icon. */
export const WebAppNote = ({ icon, tone = "neutral", children, className }: WebAppNoteProps) => (
  <div className={cn("flex gap-2.5 rounded-lg px-4 py-3 text-xs", toneStyles[tone].box, className)}>
    {icon && <span className={cn("mt-px shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5", toneStyles[tone].icon)}>{icon}</span>}
    <p>{children}</p>
  </div>
);
