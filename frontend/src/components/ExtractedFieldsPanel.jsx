export default function ExtractedFieldsPanel({ fields, setFields }) {
  const handleChange = (id, value) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value, userConfirmed: true } : f))
    );
  };

  const handleConfirm = (id) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, userConfirmed: true } : f))
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Extracted Fields
        </h3>
        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          Mock Data
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Simulated extraction results. Edit any value to mark it as
        user-confirmed. Real OCR comes in Phase 4.
      </p>

      <div className="mt-3 space-y-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="rounded border border-slate-200 bg-slate-50 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700">
                  {field.label}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Raw: <span className="font-mono">{field.rawText}</span> ·
                  Confidence: {field.confidence.toFixed(2)} · Source:{" "}
                  {field.sourceRegion}
                </p>
              </div>
              {field.userConfirmed ? (
                <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
                  Confirmed
                </span>
              ) : (
                <button
                  onClick={() => handleConfirm(field.id)}
                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Confirm
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                className="w-28 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={field.value}
                onChange={(e) => handleChange(field.id, Number(e.target.value))}
              />
              <span className="text-xs text-slate-500">{field.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
