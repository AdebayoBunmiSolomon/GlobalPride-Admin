import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { RefreshCw, Trash2, Upload } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { cn } from "@/utils/cn";
import { ACCEPTED_CREATIVE_TYPES, MAX_CREATIVE_BYTES } from "./advertisementOptions";

interface CreativeUploadProps {
  id: string;
  /** Image URL / data URL of the current creative, or empty. */
  value?: string;
  onChange: (value: string) => void;
  /** Called with a message when the chosen file is rejected. */
  onInvalid: (message: string) => void;
  error?: ReactNode;
}

const hint = "JPG, PNG or WebP · up to 5 MB";

/** Creative image picker: a drop zone when empty, otherwise a thumbnail with Replace / Remove. */
export const CreativeUpload = ({ id, value, onChange, onInvalid, error }: CreativeUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // TODO: upload to the API and keep the returned URL instead of a data URL.
  const readFile = (file?: File) => {
    if (!file) return;
    if (!ACCEPTED_CREATIVE_TYPES.includes(file.type)) {
      onInvalid("Please upload a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_CREATIVE_BYTES) {
      onInvalid("The image must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => onInvalid("We couldn't read that file. Please try another image.");
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    readFile(event.dataTransfer.files[0]);
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_CREATIVE_TYPES.join(",")}
        className="sr-only"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => {
          readFile(event.target.files?.[0]);
          // Allow choosing the same file again after removing it.
          event.target.value = "";
        }}
      />

      {value ? (
        <div className="flex flex-wrap items-center gap-4">
          <img
            src={value}
            alt="Advertisement creative"
            className="aspect-2/1 w-48 rounded-lg border border-gray-200 object-cover"
          />
          <div>
            <p className="text-xs text-gray-500">{hint}</p>
            <div className="mt-2 flex gap-2">
              <WebAppButton
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </WebAppButton>
              <WebAppButton
                variant="outline"
                size="sm"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => onChange("")}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Remove
              </WebAppButton>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-gray-300 bg-stone-50 hover:bg-gray-50",
            error && "border-red-300",
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
            <Upload className="h-4 w-4" />
          </span>
          <span className="mt-3 text-sm font-medium text-gray-900">Upload creative image</span>
          <span className="mt-0.5 text-xs text-gray-500">{hint}</span>
        </label>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
