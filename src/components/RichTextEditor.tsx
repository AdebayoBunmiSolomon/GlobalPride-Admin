import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Pilcrow } from "lucide-react";

import { cn } from "@/utils/cn";
import { isEmptyRichText, normalizeLink, richTextClass } from "@/utils/richText";

interface WebAppRichTextEditorProps {
  id: string;
  /** HTML. Empty content is reported as "". */
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: ReactNode;
  /** ID of the element that labels the editor. */
  labelledBy?: string;
  /** Classes for the editable area, e.g. a min height. */
  className?: string;
  containerClassName?: string;
}

type ActiveFormats = { bold: boolean; italic: boolean; ul: boolean; ol: boolean; block: string };

const noFormats: ActiveFormats = { bold: false, italic: false, ul: false, ol: false, block: "" };

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ToolbarButton = ({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    // Keep the editor's selection when clicking the toolbar.
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
      active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900",
    )}
  >
    <Icon className="h-4 w-4" />
  </button>
);

/**
 * Small rich text editor (headings, paragraphs, bold, italic, lists, links)
 * built on `contentEditable`. Sanitize the HTML with `sanitizeRichText`
 * before saving or rendering it.
 */
export const WebAppRichTextEditor = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  labelledBy,
  className,
  containerClassName,
}: WebAppRichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [formats, setFormats] = useState<ActiveFormats>(noFormats);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  // Load outside changes (initial value, form reset) into the DOM, but never
  // while the user is typing, which would move the caret.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    if (editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  // Reflect the formatting at the caret in the toolbar.
  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const anchor = document.getSelection()?.anchorNode;
      if (!editor || !anchor || !editor.contains(anchor)) return;
      setFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block: document.queryCommandValue("formatBlock").toLowerCase(),
      });
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const emit = () => {
    const html = editorRef.current?.innerHTML ?? "";
    onChange(isEmptyRichText(html) ? "" : html);
  };

  // `execCommand` is deprecated but still the only built-in way to edit a
  // contentEditable with undo support, and it works in every current browser.
  const exec = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emit();
  };

  const toggleBlock = (tag: "h2" | "p") => exec("formatBlock", formats.block === tag && tag === "h2" ? "<p>" : `<${tag}>`);

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = document.getSelection();
    if (!editor || !selection) return;
    editor.focus();
    if (savedRange.current) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
  };

  const openLink = () => {
    const selection = document.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    savedRange.current = range && editorRef.current?.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
    setLinkUrl("");
    setLinkError("");
    setLinkOpen(true);
  };

  const closeLink = () => {
    setLinkOpen(false);
    restoreSelection();
  };

  const applyLink = () => {
    const url = normalizeLink(linkUrl);
    if (!url) {
      setLinkError("Enter a valid web address, e.g. https://example.com.");
      return;
    }
    restoreSelection();
    const collapsed = savedRange.current?.collapsed ?? true;
    if (collapsed) exec("insertHTML", `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`);
    else exec("createLink", url);
    setLinkOpen(false);
  };

  const removeLink = () => {
    restoreSelection();
    exec("unlink");
    setLinkOpen(false);
  };

  const handleLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Don't submit the surrounding form.
      event.preventDefault();
      applyLink();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeLink();
    }
  };

  // Paste as plain text so formatting from other apps doesn't leak in.
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
    emit();
  };

  return (
    <div className={containerClassName}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-white transition-colors focus-within:ring-2",
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-gray-300 focus-within:border-primary focus-within:ring-primary/20",
        )}
      >
        <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-stone-50 px-2 py-1.5">
          <ToolbarButton label="Heading" icon={Heading2} active={formats.block === "h2"} onClick={() => toggleBlock("h2")} />
          <ToolbarButton label="Paragraph" icon={Pilcrow} active={formats.block === "p"} onClick={() => toggleBlock("p")} />
          <ToolbarButton label="Bold" icon={Bold} active={formats.bold} onClick={() => exec("bold")} />
          <ToolbarButton label="Italic" icon={Italic} active={formats.italic} onClick={() => exec("italic")} />
          <ToolbarButton label="Bulleted list" icon={List} active={formats.ul} onClick={() => exec("insertUnorderedList")} />
          <ToolbarButton label="Numbered list" icon={ListOrdered} active={formats.ol} onClick={() => exec("insertOrderedList")} />
          <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
          <ToolbarButton label="Link" icon={Link2} active={linkOpen} onClick={openLink} />
        </div>

        {linkOpen && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
            <input
              type="url"
              autoFocus
              aria-label="Link address"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(event) => {
                setLinkUrl(event.target.value);
                setLinkError("");
              }}
              onKeyDown={handleLinkKeyDown}
              className="h-8 min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button type="button" onClick={applyLink} className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary/90">
              Apply
            </button>
            <button type="button" onClick={removeLink} className="h-8 rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100">
              Remove link
            </button>
            <button type="button" onClick={closeLink} className="h-8 rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            {linkError && <p className="w-full text-xs text-red-500">{linkError}</p>}
          </div>
        )}

        <div className="relative">
          {!value && placeholder && (
            <span className="pointer-events-none absolute top-3 left-4 text-sm text-gray-400" aria-hidden="true">
              {placeholder}
            </span>
          )}
          <div
            ref={editorRef}
            id={id}
            role="textbox"
            aria-multiline="true"
            aria-labelledby={labelledBy}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onBlur={onBlur}
            onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
            onPaste={handlePaste}
            className={cn("min-h-48 px-4 py-3 outline-none", richTextClass, className)}
          />
        </div>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
