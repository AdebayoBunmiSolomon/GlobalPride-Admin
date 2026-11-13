import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/utils/cn";

export interface TabLink {
  label: string;
  to: string;
  icon?: ComponentType<{ className?: string }>;
  /** Match the path exactly, e.g. for a section's index tab. */
  end?: boolean;
}

interface WebAppTabsProps {
  /** Accessible name for the tab bar. */
  label: string;
  tabs: TabLink[];
  className?: string;
}

/** Pill-style tab bar where each tab is a route. */
export const WebAppTabs = ({ label, tabs, className }: WebAppTabsProps) => (
  <nav
    aria-label={label}
    className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-lg border border-gray-200 bg-stone-50 p-1", className)}
  >
    {tabs.map(({ label: tabLabel, to, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-primary text-white shadow-sm" : "text-gray-700 hover:bg-white",
          )
        }
      >
        {Icon && <Icon className="h-4 w-4" />}
        {tabLabel}
      </NavLink>
    ))}
  </nav>
);
