import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface WebAppDetailListProps {
  items: { label: string; value: ReactNode }[];
  /** `right` pushes values to the far edge, label on the left. */
  align?: "left" | "right";
  className?: string;
}

/** Label / value rows, e.g. read-only account details. */
export const WebAppDetailList = ({
  items,
  align = "left",
  className,
}: WebAppDetailListProps) => (
  <dl className={cn("divide-y divide-gray-100", className)}>
    {items.map((item) => (
      <div
        key={item.label}
        className={cn(
          "gap-4 py-3 text-sm",
          align === "right" ? "flex items-center justify-between" : "grid grid-cols-[8rem_1fr]",
        )}
      >
        <dt className="text-gray-500">{item.label}</dt>
        <dd className={cn("font-medium text-gray-900", align === "right" && "text-right break-all")}>
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);
