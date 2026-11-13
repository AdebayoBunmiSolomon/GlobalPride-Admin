import { useState, type DragEvent } from "react";
import { CircleCheck, Download, FileSpreadsheet, Upload } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import { useAudience } from "@/hooks/useAudience";
import { cn } from "@/utils/cn";
import { downloadCsv } from "@/utils/csv";
import { audienceCsvTemplate, parseAudienceCsv } from "./parseAudienceCsv";

interface UploadAudienceModalProps {
  onClose: () => void;
}

const downloadTemplate = () => downloadCsv("audience-template.csv", audienceCsvTemplate);

// Mounted only while open, so each upload starts fresh.
export const UploadAudienceModal = ({ onClose }: UploadAudienceModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  const chooseFile = (selected: File | undefined) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Only CSV files are supported.");
      return;
    }
    setFile(selected);
    setError(null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  // TODO: upload the file to the audience API instead of parsing it in the browser.
  const handleUpload = async () => {
    if (!file) {
      setError("Choose a CSV file to upload.");
      return;
    }

    setUploading(true);
    const { states, lgas, records, addRecords } = useAudience.getState();
    const parsed = parseAudienceCsv(await file.text(), {
      states,
      lgas,
      existingPhones: new Set(records.map((record) => record.phone)),
    });
    setUploading(false);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (parsed.records.length === 0) {
      setError(
        `None of the ${parsed.skipped.toLocaleString()} rows could be imported. Check phone numbers, states, LGAs and genders, and remove numbers already in the database.`,
      );
      return;
    }

    addRecords(parsed.records);
    setResult({ added: parsed.records.length, skipped: parsed.skipped });
  };

  return (
    <WebAppModal open onClose={onClose} title="Upload Audience Database" className="max-w-lg">
      {result ? (
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <CircleCheck className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-medium text-gray-900">
            {result.added.toLocaleString()} audience {result.added === 1 ? "record" : "records"} added
          </p>
          {result.skipped > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              {result.skipped.toLocaleString()} {result.skipped === 1 ? "row was" : "rows were"} skipped because
              of invalid or duplicate details.
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <WebAppButton onClick={onClose}>Done</WebAppButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV with the columns Phone Number, First Name, Last Name, State, LGA and Gender.
          </p>

          <label
            htmlFor="audienceFile"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-gray-300 hover:bg-gray-50",
              error && "border-red-300",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {file ? <FileSpreadsheet className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </span>
            {file ? (
              <>
                <span className="mt-3 text-sm font-medium text-gray-900">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · Click to change</span>
              </>
            ) : (
              <>
                <span className="mt-3 text-sm font-medium text-gray-900">
                  <span className="text-primary">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs text-gray-500">CSV files only</span>
              </>
            )}
            <input
              id="audienceFile"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                // Allow choosing the same file again after an error.
                event.target.value = "";
              }}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Download className="h-4 w-4" />
              Download template
            </button>
            <div className="flex gap-3">
              <WebAppButton variant="outline" onClick={onClose}>
                Cancel
              </WebAppButton>
              <WebAppButton onClick={handleUpload} loading={uploading}>
                Upload
              </WebAppButton>
            </div>
          </div>
        </div>
      )}
    </WebAppModal>
  );
};
