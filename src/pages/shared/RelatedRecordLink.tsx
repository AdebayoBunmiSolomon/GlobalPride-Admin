import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface RelatedLinkProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  title: string;
  subtitle?: string;
  to: string;
}

/** Card-style link to another record, e.g. under "Related Information". */
export const RelatedLink = ({ icon: Icon, label, title, subtitle, to }: RelatedLinkProps) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-gray-50/60"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-xs text-gray-500">{label}</span>
      <span className="block truncate text-sm font-medium text-gray-900">{title}</span>
      {subtitle && <span className="block truncate text-xs text-gray-600">{subtitle}</span>}
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
  </Link>
);
