import { useRef } from "react";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 25;

export default function UploadPanel({
  file,
  setFile,
  setPreviewUrl,
  setFileType,
  error,
  setError,
}) {
  const inputRef = useRef(null);

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
    if (selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    handleFile(dropped);
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl("");
    setFileType("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Drawing Upload</h3>
      <p className="mt-1 text-xs text-slate-500">
        PDF, JPG, or PNG. Max {MAX_MB} MB. Preview is local only.
      </p>

      {!file && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-blue-400 hover:bg-blue-50"
          onClick={() => inputRef.current?.click()}
        >
          <p className="text-sm font-medium text-slate-700">
            Click to choose a file, or drag and drop here
          </p>
          <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {file && (
        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                {file.type || "unknown"}
              </p>
            </div>
            <button
              onClick={handleClear}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
