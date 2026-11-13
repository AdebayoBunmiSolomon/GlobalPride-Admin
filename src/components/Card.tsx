import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface WebAppCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered at the top-right of the header, e.g. a link or toggle. */
  action?: ReactNode;
  /** Separate the header from the body with a border. */
  divided?: boolean;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const WebAppCard = ({
  title,
  description,
  action,
  divided = false,
  children,
  className,
  bodyClassName,
}: WebAppCardProps) => {
  const hasHeader = Boolean(title || description || action);

  return (
    <section
      className={cn("rounded-xl border border-gray-200 bg-white", className)}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-4 px-5 pt-5",
            divided ? "border-b border-gray-200 pb-4" : "pb-1",
          )}
        >
          <div>
            {title && (
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}

      {children && (
        <div className={cn("p-5", hasHeader && !divided && "pt-4", bodyClassName)}>
          {children}
        </div>
      )}
    </section>
  );
};
