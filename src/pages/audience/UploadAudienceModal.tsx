import { useState, type DragEvent } from "react";
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, Upload, X } from "lucide-react";

import type { ApiError, AudienceUploadFileResult } from "@/api/types/response";
import { WebAppButton } from "@/components/Button";
import { WebAppModal } from "@/components/Modal";
import { uploadAudienceFiles } from "@/store/audienceStore";
import { cn } from "@/utils/cn";
import { downloadCsv } from "@/utils/csv";

interface UploadAudienceModalProps {
  onClose: () => void;
}

const audienceCsvTemplate =
  "Phone Number,First Name,Last Name,State,LGA,Gender\n08012345678,Ada,Okafor,Lagos,Ikeja,Female\n";

const downloadTemplate = () => downloadCsv("audience-template.csv", audienceCsvTemplate);

const ACCEPTED = [".csv", ".xlsx"];
const isAccepted = (file: File) => ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension));

const plural = (count: number, one: string, many: string) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

const FileResult = ({ result }: { result: AudienceUploadFileResult }) => {
  const ok = result.added > 0 || (result.rejected === 0 && result.reasons.length === 0);
  const stats = [
    { label: "Added", value: result.added, className: "text-green-700" },
    { label: "Already stored", value: result.alreadyStored },
    { label: "Repeated in file", value: result.repeated },
    { label: "Rejected", value: result.rejected, className: result.rejected > 0 ? "text-red-600" : undefined },
  ];

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
        {ok ? (
          <CircleCheck className="h-4 w-4 shrink-0 text-green-600" />
        ) : (
          <CircleAlert className="h-4 w-4 shrink-0 text-red-600" />
        )}
        <span className="truncate">{result.fileName}</span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md bg-stone-50 px-3 py-2">
            <dt className="text-xs text-gray-500">{stat.label}</dt>
            <dd className={cn("text-sm font-semibold text-gray-900", stat.className)}>{stat.value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      {result.reasons.length > 0 && (
        <details className="mt-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-700">
            {plural(result.reasons.length, "issue", "issues")}
          </summary>
          <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5">
            {result.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
};

// Mounted only while open, so each upload starts fresh.
export const UploadAudienceModal = ({ onClose }: UploadAudienceModalProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ files: AudienceUploadFileResult[]; message?: string | null } | null>(null);

  const addFiles = (selected: FileList | null | undefined) => {
    const list = Array.from(selected ?? []);
    if (list.length === 0) return;
    const accepted = list.filter(isAccepted);
    setError(accepted.length < list.length ? "Only .csv and .xlsx files are supported." : null);
    // Choosing a file with the same name again replaces it.
    setFiles((current) => [
      ...current.filter((file) => !accepted.some((next) => next.name === file.name)),
      ...accepted,
    ]);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Choose at least one .csv or .xlsx file to upload.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      setResult(await uploadAudienceFiles(files));
    } catch (caught) {
      const apiError = caught as Partial<ApiError>;
      setError(apiError.errors?.length ? apiError.errors.join("\n") : apiError.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (result) {
    const added = result.files.reduce((sum, file) => sum + file.added, 0);
    return (
      <WebAppModal open onClose={onClose} title="Upload Complete" className="max-w-xl">
        <p className="text-sm text-gray-600">
          {plural(added, "contact was", "contacts were")} added
          {result.files.length > 1 ? ` from ${result.files.length} files` : ""}.
          {result.files.length === 0 && result.message ? ` ${result.message}` : ""}
        </p>
        {result.files.length > 0 && (
          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
            {result.files.map((file, index) => (
              <FileResult key={`${file.fileName}-${index}`} result={file} />
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end">
          <WebAppButton onClick={onClose}>Done</WebAppButton>
        </div>
      </WebAppModal>
    );
  }

  return (
    <WebAppModal open onClose={uploading ? () => undefined : onClose} title="Upload Audience Database" className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload one or more .csv or .xlsx files with the columns Phone Number, First Name, Last Name, State, LGA and
          Gender. Numbers already stored are skipped, so re-uploading a file is safe.
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
            <Upload className="h-5 w-5" />
          </span>
          <span className="mt-3 text-sm font-medium text-gray-900">
            <span className="text-primary">Click to upload</span> or drag and drop
          </span>
          <span className="text-xs text-gray-500">.csv or .xlsx · several files at once</span>
          <input
            id="audienceFile"
            type="file"
            multiple
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              // Allow choosing the same file again.
              event.target.value = "";
            }}
          />
        </label>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-gray-900">{file.name}</span>
                <span className="shrink-0 text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                <button
                  type="button"
                  onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                  disabled={uploading}
                  aria-label={`Remove ${file.name}`}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm whitespace-pre-line text-red-600">
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
            <WebAppButton variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </WebAppButton>
            <WebAppButton onClick={handleUpload} loading={uploading} loadingText="Uploading…">
              Upload {files.length > 1 ? `${files.length} Files` : ""}
            </WebAppButton>
          </div>
        </div>
      </div>
    </WebAppModal>
  );
};
