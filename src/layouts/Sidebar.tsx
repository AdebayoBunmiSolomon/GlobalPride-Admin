import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  ChartLine,
  EllipsisVertical,
  Headset,
  Image,
  LayoutGrid,
  Megaphone,
  Settings,
  ShieldCheck,
  Tag,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { WebAppAvatar } from "@/components/Avatar";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/utils/cn";

const navItems = [
  { label: "Dashboard Overview", to: "/dashboard", icon: LayoutGrid },
  { label: "User Management", to: "/users", icon: User },
  { label: "Campaign Management", to: "/campaigns", icon: Megaphone },
  { label: "Pricing Management", to: "/pricing", icon: Tag },
  { label: "Audience Marketplace", to: "/audience-marketplace", icon: Users },
  { label: "Wallet Management", to: "/wallets", icon: Wallet },
  { label: "Finance & Reports", to: "/finance", icon: ChartLine },
  { label: "Referral Management", to: "/referrals", icon: UserPlus },
  { label: "Advertisement Management", to: "/advertisements", icon: Image },
  { label: "Support", to: "/support", icon: Headset },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Compliance", to: "/compliance", icon: ShieldCheck },
  { label: "Settings", to: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const admin = useCurrentAdmin();
  const { platformName, logo } = useSettings((state) => state.general);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-68 flex-col bg-sidebar text-white transition-transform",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 p-1">
            <img src={logo || "/global-pride-logo.png"} alt="" className="h-full w-full rounded object-contain" />
          </span>
          <span>
            <span className="block truncate text-sm font-semibold">{platformName}</span>
            <span className="block text-xs text-white/70">Admin Console</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-2 px-3 text-xs text-white/60">Menu</p>
          <ul className="space-y-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-white font-medium text-primary"
                        : "text-white/90 hover:bg-white/10",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 border-t border-white/15 px-5 py-4 hover:bg-white/5"
        >
          <WebAppAvatar name={admin.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{admin.name}</span>
            <span className="block truncate text-xs text-white/70">{admin.role}</span>
          </span>
          <EllipsisVertical className="h-4 w-4 text-white/70" />
        </Link>
      </aside>
    </>
  );
};
