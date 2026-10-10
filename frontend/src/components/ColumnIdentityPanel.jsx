export default function ColumnIdentityPanel({ identity, setIdentity }) {
  const handleChange = (field, value) => {
    setIdentity((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Column Identity</h3>
      <p className="mt-1 text-xs text-slate-500">
        Confirm the column mark, storey, and grid before linking evidence.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field
          label="Column Mark"
          placeholder="e.g., C1"
          value={identity.columnMark}
          onChange={(v) => handleChange("columnMark", v)}
        />
        <Field
          label="Storey"
          placeholder="e.g., 2F-3F"
          value={identity.storey}
          onChange={(v) => handleChange("storey", v)}
        />
        <Field
          label="Grid X"
          placeholder="e.g., 1"
          value={identity.gridX}
          onChange={(v) => handleChange("gridX", v)}
        />
        <Field
          label="Grid Y"
          placeholder="e.g., A"
          value={identity.gridY}
          onChange={(v) => handleChange("gridY", v)}
        />
      </div>

      <div className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-500">
          Linkage key preview:{" "}
          <span className="font-mono text-slate-700">
            {[
              identity.columnMark,
              identity.storey,
              identity.gridX,
              identity.gridY,
            ]
              .filter(Boolean)
              .join(" / ") || "—"}
          </span>
        </p>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
