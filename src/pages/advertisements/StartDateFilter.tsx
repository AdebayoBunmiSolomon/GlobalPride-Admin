import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppInput } from "@/components/Input";
import { cn } from "@/utils/cn";
import { formatDateOnly } from "@/utils/format";

/** Inclusive "YYYY-MM-DD" bounds; an empty string means unbounded. */
export interface DateRangeValue {
  from: string;
  to: string;
}

interface StartDateFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const summarize = ({ from, to }: DateRangeValue) => {
  if (from && to) return from === to ? formatDateOnly(from) : `${formatDateOnly(from)} – ${formatDateOnly(to)}`;
  if (from) return `From ${formatDateOnly(from)}`;
  if (to) return `Until ${formatDateOnly(to)}`;
  return "Start Date";
};

/** "Start Date" button that opens a From / To popover. */
export const StartDateFilter = ({ value, onChange }: StartDateFilterProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const isActive = Boolean(value.from || value.to);
  const invalid = Boolean(draft.from && draft.to && draft.from > draft.to);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const toggle = () => {
    // Start each opening from the applied range, discarding unapplied edits.
    if (!open) setDraft(value);
    setOpen(!open);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    setDraft({ from: "", to: "" });
    onChange({ from: "", to: "" });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium transition-colors sm:w-auto",
          open || isActive ? "border-primary text-primary" : "border-gray-300 text-gray-900 hover:bg-gray-50",
          open && "ring-2 ring-primary/20",
        )}
      >
        <CalendarDays className={cn("h-4 w-4", isActive ? "text-primary" : "text-gray-500")} />
        <span className="flex-1 truncate text-left">{summarize(value)}</span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Start date filter"
          className="absolute top-full right-0 z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:right-auto sm:left-0"
        >
          <p className="text-sm font-semibold text-gray-900">Start date</p>
          <p className="mt-0.5 text-xs text-gray-500">Shows advertisements whose scheduled start date falls in this range.</p>

          <div className="mt-4 space-y-3">
            <WebAppInput
              id="adStartFrom"
              type="date"
              label="From"
              labelClassName="text-xs"
              size="sm"
              value={draft.from}
              max={draft.to || undefined}
              onChange={(event) => setDraft({ ...draft, from: event.target.value })}
              className="bg-white"
            />
            <WebAppInput
              id="adStartTo"
              type="date"
              label="To"
              labelClassName="text-xs"
              size="sm"
              value={draft.to}
              min={draft.from || undefined}
              onChange={(event) => setDraft({ ...draft, to: event.target.value })}
              error={invalid ? "“To” must be on or after “From”." : undefined}
              className="bg-white"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <WebAppButton variant="ghost" size="sm" onClick={clear}>
              Clear
            </WebAppButton>
            <WebAppButton size="sm" onClick={apply} disabled={invalid}>
              Apply
            </WebAppButton>
          </div>
        </div>
      )}
    </div>
  );
};
