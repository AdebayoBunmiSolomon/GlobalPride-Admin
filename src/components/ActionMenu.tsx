import { useEffect, useRef, useState, type ComponentType } from "react";
import { EllipsisVertical } from "lucide-react";

import { cn } from "@/utils/cn";

export interface ActionMenuItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  /** Red text, e.g. Delete / End. */
  danger?: boolean;
  /** Draw a divider above this item. */
  separated?: boolean;
}

interface WebAppActionMenuProps {
  /** Accessible name for the "⋮" button, e.g. "Actions for AD-1001". */
  label: string;
  items: ActionMenuItem[];
  className?: string;
}

type MenuPosition = { right: number; top?: number; bottom?: number };

const ITEM_HEIGHT = 40;

/**
 * Row "⋮" menu. The menu is positioned `fixed` from the button so a table's
 * horizontal scroll container doesn't clip it, and flips upwards near the
 * bottom of the screen.
 */
export const WebAppActionMenu = ({ label, items, className }: WebAppActionMenuProps) => {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;

    const close = () => setPosition(null);
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    menuRef.current?.querySelector("button")?.focus();
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  const toggle = () => {
    if (position || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const menuHeight = items.length * ITEM_HEIGHT + 16;
    setPosition(
      rect.bottom + menuHeight > window.innerHeight
        ? { right, bottom: window.innerHeight - rect.top + 4 }
        : { right, top: rect.bottom + 4 },
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
        className={cn(
          "rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700",
          className,
        )}
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>

      {position && (
        <div
          ref={menuRef}
          role="menu"
          style={position}
          className="fixed z-40 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger, separated }) => (
            <div key={itemLabel} className={cn(separated && "mt-1 border-t border-gray-100 pt-1")}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPosition(null);
                  onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors focus:outline-none",
                  danger
                    ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {itemLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
