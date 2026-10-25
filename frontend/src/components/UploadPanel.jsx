import { useRef, useState } from "react";
import StepHeader from "./StepHeader";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 25;

export default function UploadPanel({
  file,
  setFile,
  setFileType,
  error,
  setError,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (selected) => {
    setError("");
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Unsupported file type. Please upload PDF, JPG, or PNG.");
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum is ${MAX_MB} MB.`);
      return;
    }

    setFile(selected);
    setFileType(selected.type);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleClear = () => {
    setFile(null);
    setFileType("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => inputRef.current?.click();
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5">
      <StepHeader
        step={1}
        title="Source document"
        hint={`Upload the drawing set as a PDF, or a single image crop. PDF, JPG or PNG, up to ${MAX_MB} MB.`}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="mt-4 flex-1">
        {!file ? (
          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex h-full min-h-[11rem] cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-4 py-8 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              dragging
                ? "border-blue-600 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-500"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-7 w-7 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 16V4m0 0L7 9m5-5 5 5" />
              <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-800">
              Drop your file here, or choose one
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use the original sheet for the best extraction.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-sm border border-slate-300 bg-slate-50 p-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-sm border border-slate-800 bg-white text-xs font-semibold text-slate-900">
              {isPdf ? "PDF" : "IMG"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {isPdf
                  ? " · Crop views A to C from this PDF below"
                  : " · Used directly as the source image"}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}
