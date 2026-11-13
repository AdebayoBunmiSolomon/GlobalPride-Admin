import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Bell, CircleCheck, Info, Settings, ShieldCheck } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppPageHeader } from "@/components/PageHeader";
import { cn } from "@/utils/cn";

const sections = [
  { label: "General", to: "/settings", icon: Settings, end: true },
  { label: "Notifications", to: "/settings/notifications", icon: Bell, end: false },
  { label: "Security", to: "/settings/security", icon: ShieldCheck, end: false },
  { label: "Platform Information", to: "/settings/platform", icon: Info, end: false },
];

interface SettingsLayoutProps {
  title: string;
  description: string;
  /** Breadcrumb label for a sub-section; omit on General. */
  section?: string;
  children: ReactNode;
}

/** Settings page shell: header, section nav on the left, content on the right. */
export const SettingsLayout = ({ title, description, section, children }: SettingsLayoutProps) => (
  <div>
    <WebAppPageHeader
      title={title}
      description={description}
      breadcrumbs={
        section
          ? [{ label: "Dashboard", to: "/dashboard" }, { label: "Settings", to: "/settings" }, { label: section }]
          : [{ label: "Dashboard", to: "/dashboard" }, { label: "Settings" }]
      }
    />
    <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="rounded-xl border border-gray-200 bg-white p-2 lg:sticky lg:top-22">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {sections.map(({ label, to, icon: Icon, end }) => (
            <li key={to} className="shrink-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  </div>
);

interface SettingsFooterProps {
  /** Whether the form has unsaved changes. */
  dirty: boolean;
  /** Show the "saved" confirmation (cleared once the form is edited again). */
  saved: boolean;
  submitting?: boolean;
  onCancel: () => void;
}

/** Cancel (discard changes) + Save Changes, with a confirmation after saving. */
export const SettingsFooter = ({ dirty, saved, submitting, onCancel }: SettingsFooterProps) => (
  <div className="flex flex-wrap items-center justify-end gap-3">
    {saved && !dirty && (
      <p role="status" className="mr-auto inline-flex items-center gap-1.5 text-sm text-green-700">
        <CircleCheck className="h-4 w-4" />
        Changes saved.
      </p>
    )}
    <WebAppButton variant="outline" onClick={onCancel} disabled={!dirty}>
      Cancel
    </WebAppButton>
    <WebAppButton type="submit" loading={submitting} disabled={!dirty}>
      Save Changes
    </WebAppButton>
  </div>
);
