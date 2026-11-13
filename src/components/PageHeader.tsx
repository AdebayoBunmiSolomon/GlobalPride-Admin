import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { WebAppText } from "./Text";

interface Breadcrumb {
  label: string;
  to?: string;
}

interface WebAppPageHeaderProps {
  /** Optional, e.g. detail pages that only show breadcrumbs + a back link. */
  title?: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  /** "← Back to …" link shown under the breadcrumbs. */
  backLink?: { label: string; to: string };
  /** Rendered on the right, e.g. a filter or primary action. */
  actions?: ReactNode;
  /** Icon shown in a tile to the left of the title and description. */
  icon?: ReactNode;
}

export const WebAppPageHeader = ({
  title,
  description,
  breadcrumbs,
  backLink,
  actions,
  icon,
}: WebAppPageHeaderProps) => (
  <div className="mb-6">
    {breadcrumbs && (
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
            {crumb.to ? (
              <Link to={crumb.to} className="text-gray-500 hover:text-gray-700">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
    )}

    {backLink && (
      <Link
        to={backLink.to}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLink.label}
      </Link>
    )}

    {(title || description || actions) && (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        )}
        <div>
          {title && (
            <WebAppText as="h1" variant="h1" weight="bold">
              {title}
            </WebAppText>
          )}
          {description && (
            <WebAppText variant="body-sm" color="muted" className="mt-1">
              {description}
            </WebAppText>
          )}
        </div>
      </div>
      {actions}
    </div>
    )}
  </div>
);
