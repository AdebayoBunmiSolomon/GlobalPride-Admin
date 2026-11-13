import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Loader2, Search } from "lucide-react";

import { cn } from "@/utils/cn";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: ReactNode;
}

type SelectSize = "sm" | "md" | "lg";

interface WebAppSelectInputProps {
  id?: string;

  activeRingClassName?: string;

  label?: ReactNode;
  labelClassName?: string;

  options: SelectOption[];

  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;

  placeholder?: string;

  leftIcon?: ReactNode;

  error?: ReactNode;
  helperText?: ReactNode;

  loading?: boolean;
  loadingColor?: string;

  searchable?: boolean;
  searchPlaceholder?: string;

  disabled?: boolean;

  size?: SelectSize;

  fullWidth?: boolean;
  containerClassName?: string;
  className?: string;

  required?: boolean;
}

const sizeStyles: Record<SelectSize, string> = {
  sm: "h-9 text-xs",
  md: "h-11 text-sm",
  lg: "h-13 text-base",
};

export const WebAppSelectInput = ({
  id,
  activeRingClassName,
  label,
  labelClassName,

  options,

  value,
  defaultValue,
  onChange,

  placeholder = "Select an option",

  leftIcon,

  error,
  helperText,

  loading = false,
  loadingColor,

  searchable = false,
  searchPlaceholder = "Search...",

  disabled = false,

  size = "md",

  fullWidth = true,
  containerClassName,
  className,

  required = false,
}: WebAppSelectInputProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const isDisabled = disabled || loading;

  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  /**
   * Filter options when searching.
   */
  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options;
    }

    const query = search.toLowerCase();

    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  /**
   * Close when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Focus search input when dropdown opens.
   */
  useEffect(() => {
    if (isOpen && searchable) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen, searchable]);

  const selectOption = (option: SelectOption) => {
    if (option.disabled) {
      return;
    }

    if (!isControlled) {
      setInternalValue(option.value);
    }

    onChange?.(option.value);

    setIsOpen(false);
    setSearch("");
  };

  const getNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    let index = startIndex;

    while (true) {
      index += direction;

      if (index < 0 || index >= filteredOptions.length) {
        return startIndex;
      }

      if (!filteredOptions[index].disabled) {
        return index;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      return;
    }

    if (!isOpen) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setIsOpen(true);
      }

      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        setHighlightedIndex((current) => getNextEnabledIndex(current, 1));

        break;

      case "ArrowUp":
        event.preventDefault();

        setHighlightedIndex((current) => getNextEnabledIndex(current, -1));

        break;

      case "Enter":
        event.preventDefault();

        if (filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex]);
        }

        break;

      case "Escape":
        event.preventDefault();

        setIsOpen(false);
        setSearch("");

        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative", fullWidth && "w-full", containerClassName)}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 block text-sm font-medium",
            isDisabled ? "text-gray-400" : "text-gray-700",
            labelClassName,
          )}
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Trigger */}
      <button
        id={id}
        type="button"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex w-full items-center rounded-lg border bg-white",
          "outline-none focus:outline-none",
          "transition-all duration-200",

          sizeStyles[size],

          isOpen
            ? cn("border-primary ring-2 ring-primary/20", activeRingClassName)
            : "border-gray-300",

          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",

          isDisabled && "cursor-not-allowed bg-gray-50 text-gray-400",

          className,
        )}
      >
        {/* Left icon */}
        {leftIcon && (
          <span className="ml-3 shrink-0 text-gray-400" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Selected value */}
        <span
          className={cn(
            "flex-1 truncate text-left",
            leftIcon ? "ml-2" : "ml-3",
            selectedOption ? "text-gray-900" : "text-gray-400",
          )}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        {/* Right icon */}
        <span className="mr-3 shrink-0 text-gray-400">
          {loading ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              style={{ color: loadingColor }}
            />
          ) : (
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          )}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-2",
            "overflow-hidden rounded-lg border border-gray-200",
            "bg-white shadow-lg",
          )}
        >
          {/* Search */}
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "h-9 w-full rounded-md",
                    "border border-gray-200",
                    "bg-gray-50",
                    "pl-9 pr-3",
                    "text-sm",
                    "outline-none",
                    "focus:border-primary",
                    "focus:ring-2",
                    "focus:ring-primary/20",
                  )}
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === selectedValue;

                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setHighlightedIndex(index);
                      }
                    }}
                    onClick={() => {
                      selectOption(option);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md",
                      "px-3 py-2.5 text-left text-sm",
                      "transition-colors",

                      isHighlighted && !option.disabled && "bg-gray-100",

                      isSelected && "bg-primary/10 text-primary",

                      option.disabled && "cursor-not-allowed text-gray-300",
                    )}
                  >
                    {option.icon && (
                      <span className="shrink-0" aria-hidden="true">
                        {option.icon}
                      </span>
                    )}

                    <span className="flex-1 truncate">{option.label}</span>

                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-8 text-center text-sm text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      {/* Helper */}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
