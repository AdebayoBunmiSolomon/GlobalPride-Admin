import { useState, type ComponentType } from "react";

import { WebAppButton } from "@/components/Button";
import { WebAppTextarea } from "@/components/Textarea";

interface NoteComposerProps {
  id: string;
  /** Accessible name for the textarea. */
  label: string;
  placeholder: string;
  /** Shown after the character count, e.g. "sent to the user". */
  hint?: string;
  submitLabel: string;
  submitIcon: ComponentType<{ className?: string }>;
  /** `primary` for replies, `outline` for internal notes. */
  variant: "primary" | "outline";
  maxLength?: number;
  /** May return a promise: the button shows a spinner meanwhile, and the text is kept if it resolves to `false`. */
  onSubmit: (body: string) => void | Promise<boolean>;
}

/** Textarea + character count + submit button, for replies and internal notes. Clears after submitting. */
export const NoteComposer = ({
  id,
  label,
  placeholder,
  hint,
  submitLabel,
  submitIcon: Icon,
  variant,
  maxLength = 1000,
  onSubmit,
}: NoteComposerProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const body = text.trim();

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!body || sending) return;
        const result = onSubmit(body);
        if (!result) {
          setText("");
          return;
        }
        setSending(true);
        void result
          .then((sent) => {
            if (sent) setText("");
          })
          .finally(() => setSending(false));
      }}
    >
      <WebAppTextarea
        id={id}
        aria-label={label}
        rows={3}
        maxLength={maxLength}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={variant === "primary" ? "bg-stone-50" : "bg-white"}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {text.length}/{maxLength}
          {hint && ` · ${hint}`}
        </p>
        <WebAppButton type="submit" variant={variant} disabled={!body} loading={sending} leftIcon={<Icon className="h-4 w-4" />}>
          {submitLabel}
        </WebAppButton>
      </div>
    </form>
  );
};
