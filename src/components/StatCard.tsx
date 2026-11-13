import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/utils/cn";
import { toneStyles, type Tone } from "@/utils/tones";

interface WebAppStatCardProps {
  label: string;
  value: string;
  note?: string;
  icon: ComponentType<{ className?: string }>;
  /** Icon tile color. */
  tone?: Tone;
  /** Makes the whole card a link, with an arrow in the corner. */
  to?: string;
  className?: string;
}

export const WebAppStatCard = ({
  label,
  value,
  note,
  icon: Icon,
  tone = "purple",
  to,
  className,
}: WebAppStatCardProps) => {
  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={cn("rounded-md p-1.5", toneStyles[tone].icon)}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="flex-1 text-xs font-medium text-gray-700">{label}</p>
        {to && <ArrowUpRight className="h-4 w-4 text-gray-400" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {note && <p className="mt-1 text-xs text-gray-500">{note}</p>}
    </>
  );

  const cardClass = cn("block rounded-xl border border-gray-200 bg-white p-5", className);

  return to ? (
    <Link to={to} className={cn(cardClass, "transition-colors hover:border-primary/40 hover:bg-gray-50/60")}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
};
