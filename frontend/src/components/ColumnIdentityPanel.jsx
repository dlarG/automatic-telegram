import StepHeader from "./StepHeader";

export default function ColumnIdentityPanel({ identity, setIdentity }) {
  const handleChange = (field, value) => {
    setIdentity((prev) => ({ ...prev, [field]: value }));
  };

  const key = [
    identity.columnMark,
    identity.storey,
    identity.gridX,
    identity.gridY,
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="flex h-full flex-col rounded-md border border-slate-200 bg-white p-5">
      <StepHeader
        step={2}
        title="Column identity"
        hint="Confirm the column mark, storey and grid before linking evidence."
      />

      <div className="mt-4 border-2 border-slate-800 bg-slate-300">
        <div className="grid grid-cols-2 gap-px">
          <Cell
            label="Column mark"
            placeholder="e.g., C1"
            value={identity.columnMark}
            onChange={(v) => handleChange("columnMark", v)}
          />
          <Cell
            label="Storey"
            placeholder="e.g., 2F-3F"
            value={identity.storey}
            onChange={(v) => handleChange("storey", v)}
          />
          <Cell
            label="Grid X"
            placeholder="e.g., 1"
            value={identity.gridX}
            onChange={(v) => handleChange("gridX", v)}
          />
          <Cell
            label="Grid Y"
            placeholder="e.g., A"
            value={identity.gridY}
            onChange={(v) => handleChange("gridY", v)}
          />
        </div>
      </div>

      <div className="mt-4 rounded-sm bg-slate-900 px-4 py-3">
        <p className="text-xs text-slate-400">Linkage key</p>
        <p
          className={`mt-1 break-words text-lg font-semibold ${
            key ? "text-white" : "text-slate-500"
          }`}
        >
          {key || "Fill in the fields above"}
        </p>
      </div>
    </div>
  );
}

function Cell({ label, placeholder, value, onChange }) {
  return (
    <label className="block bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600">
      <span className="block text-xs font-medium text-slate-500">{label}</span>
      <input
        type="text"
        className="mt-1 block w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
