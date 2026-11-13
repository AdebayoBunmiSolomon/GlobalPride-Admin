import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

type TextareaSize = "sm" | "md" | "lg";
type TextareaVariant = "default" | "error";
type TextareaResize = "none" | "vertical" | "horizontal" | "both";

interface WebAppTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  /** Forwarded to the <textarea>, so `{...register("field")}` works. */
  ref?: Ref<HTMLTextAreaElement>;

  label?: ReactNode;
  labelClassName?: string;
  required?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;

  loading?: boolean;
  loadingColor?: string;

  size?: TextareaSize;
  variant?: TextareaVariant;
  resize?: TextareaResize;

  autoGrow?: boolean;
  maxAutoGrowHeight?: number;

  showCharacterCount?: boolean;

  fullWidth?: boolean;
  containerClassName?: string;
}

const sizeStyles: Record<TextareaSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-3 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

const resizeStyles: Record<TextareaResize, string> = {
  none: "resize-none",
  vertical: "resize-y",
  horizontal: "resize-x",
  both: "resize",
};

export const WebAppTextarea = ({
  label,
  required = false,
  error,
  helperText,

  loading = false,
  loadingColor,

  size = "md",
  variant = "default",
  resize = "vertical",

  autoGrow = false,
  maxAutoGrowHeight,

  showCharacterCount = false,

  fullWidth = true,
  containerClassName,

  disabled,
  className,
  id,
  labelClassName,

  rows = 4,
  maxLength,
  value,
  defaultValue,
  onChange,
  ref,

  ...props
}: WebAppTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = value !== undefined;

  // Only used to derive character count when uncontrolled.
  // Not read during render from a ref — it's real state.
  const [uncontrolledLength, setUncontrolledLength] = useState(() =>
    typeof defaultValue === "string" ? defaultValue.length : 0,
  );

  const hasError = Boolean(error);
  const isDisabled = disabled || loading;

  const currentLength = isControlled
    ? (value as string).length
    : uncontrolledLength;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setUncontrolledLength(event.target.value.length);
    }

    onChange?.(event);
  };

  /**
   * Auto-grow: sync height to scrollHeight whenever content changes.
   * Reads real DOM layout (scrollHeight) and imperatively writes to
   * it — legitimate effect use, not a state-sync anti-pattern.
   */
  useEffect(() => {
    if (!autoGrow) {
      return;
    }

    const node = textareaRef.current;

    if (!node) {
      return;
    }

    node.style.height = "auto";

    const nextHeight = maxAutoGrowHeight
      ? Math.min(node.scrollHeight, maxAutoGrowHeight)
      : node.scrollHeight;

    node.style.height = `${nextHeight}px`;
  }, [autoGrow, maxAutoGrowHeight, value, currentLength]);

  return (
    <div className={cn(fullWidth && "w-full", containerClassName)}>
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

      <div className="relative">
        <textarea
          ref={(node) => {
            textareaRef.current = node;

            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          id={id}
          required={required}
          disabled={isDisabled}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          rows={autoGrow ? 1 : rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className={cn(
            "w-full rounded-lg border bg-white",
            "outline-none focus:outline-none",
            "transition-colors duration-200",
            "placeholder:text-gray-400",
            "focus:ring-2",

            "disabled:cursor-not-allowed",
            "disabled:bg-gray-50",
            "disabled:text-gray-400",

            autoGrow ? "resize-none overflow-hidden" : resizeStyles[resize],

            sizeStyles[size],

            loading && "pr-10",

            variant === "error" || hasError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-primary focus:ring-primary/20",

            className,
          )}
          {...props}
        />

        {loading && (
          <span className="absolute right-3 top-3">
            <Loader2
              className="h-4 w-4 animate-spin"
              style={{ color: loadingColor }}
            />
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-2">
        <div className="flex-1">
          {error && (
            <p id={`${id}-error`} className="text-xs text-red-500">
              {error}
            </p>
          )}

          {!error && helperText && (
            <p id={`${id}-helper`} className="text-xs text-gray-500">
              {helperText}
            </p>
          )}
        </div>

        {showCharacterCount && maxLength && (
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              currentLength >= maxLength ? "text-red-500" : "text-gray-400",
            )}
          >
            {currentLength} / {maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
