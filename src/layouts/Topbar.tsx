import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";

import { WebAppAvatar } from "@/components/Avatar";
import { WebAppInput } from "@/components/Input";
import { authService } from "@/api/services/auth";
import { useCurrentAdmin } from "@/hooks/useAuth";

interface TopbarProps {
  onMenuClick: () => void;
}

const menuItemClass = "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50";

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const navigate = useNavigate();
  const admin = useCurrentAdmin();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    authService.signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <p className="text-lg font-semibold text-gray-900">Admin Console</p>

      <div className="ml-auto flex items-center gap-4">
        <WebAppInput
          size="sm"
          type="search"
          placeholder="Search..."
          aria-label="Search"
          leftIcon={<Search className="h-4 w-4" />}
          fullWidth={false}
          containerClassName="hidden w-48 md:block lg:w-56"
        />

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-md py-1 text-sm font-medium text-gray-900"
          >
            <WebAppAvatar name={admin.name} size="sm" />
            <span className="hidden sm:inline">{admin.name}</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              <Link to="/profile" role="menuitem" onClick={() => setMenuOpen(false)} className={`${menuItemClass} text-gray-700`}>
                Profile
              </Link>
              <Link to="/account-settings" role="menuitem" onClick={() => setMenuOpen(false)} className={`${menuItemClass} text-gray-700`}>
                Account settings
              </Link>
              <div className="my-1 border-t border-gray-100" />
              <button type="button" role="menuitem" onClick={handleSignOut} className={`${menuItemClass} text-red-600`}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
