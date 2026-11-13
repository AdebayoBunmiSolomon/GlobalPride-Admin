import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

/** Form error with the alert icon from the designs; `undefined` when there is no message. */
export const fieldError = (message?: string): ReactNode =>
  message && (
    <span className="inline-flex items-center gap-1.5">
      <CircleAlert className="h-3.5 w-3.5 shrink-0" />
      {message}
    </span>
  );
