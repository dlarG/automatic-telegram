import { useState } from "react";

const VIEWS = [
  {
    key: "A",
    name: "Locator",
    hint: "Foundation plan showing where the column sits on the grid.",
  },
  {
    key: "B",
    name: "Schedule",
    hint: "The C-1 cross-section cell from the column schedule.",
  },
  {
    key: "C",
    name: "Detail",
    hint: "Column detail elevation with the reinforcement layout.",
  },
];

const SCOPE = [
  "One column and one storey per run",
  "You provide the locator and schedule crops",
  "Checks run only after engineer-validated rules are confirmed",
];

export default function DashboardPage({
  project,
  setProject,
  onStartAnalysis,
}) {
  const [localProject, setLocalProject] = useState(project);

  const handleChange = (field, value) => {
    setLocalProject((prev) => ({ ...prev, [field]: value }));
  };

  const handleStart = () => {
    setProject(localProject);
    onStartAnalysis();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Set up your project
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Every field is optional, but what you enter here is printed on the
          final report so each result can be traced back to its drawing.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Title block */}
        <section className="lg:col-span-2">
          <div className="border-2 border-slate-800 bg-slate-300">
            <div className="grid grid-cols-1 gap-px md:grid-cols-2">
              <Cell
                label="Project ID"
                placeholder="e.g., P007"
                value={localProject.projectId}
                onChange={(v) => handleChange("projectId", v)}
              />
              <Cell
                label="Sheet ID"
                placeholder="e.g., S-10"
                value={localProject.sheetId}
                onChange={(v) => handleChange("sheetId", v)}
              />
              <Cell
                wide
                label="Project title"
                placeholder="e.g., Three Storey Apartment"
                value={localProject.title}
                onChange={(v) => handleChange("title", v)}
                large
              />
              <Cell
                wide
                label="Prepared by"
                placeholder="Your name"
                value={localProject.preparedBy}
                onChange={(v) => handleChange("preparedBy", v)}
              />
              <Cell
                wide
                multiline
                label="Notes"
                placeholder="Anything worth remembering about this run."
                value={localProject.notes}
                onChange={(v) => handleChange("notes", v)}
              />
              <div className="flex flex-col items-stretch justify-between gap-3 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center md:col-span-2">
                <p className="text-xs text-slate-500">
                  Next: upload your PDF and capture the three views.
                </p>
                <button
                  onClick={handleStart}
                  className="rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Start new analysis
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-slate-900">
              You'll capture three views
            </h3>
            <ol className="mt-4 space-y-4">
              {VIEWS.map((v) => (
                <li key={v.key} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-sm border border-slate-800 text-sm font-semibold text-slate-900"
                  >
                    {v.key}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      View {v.key}: {v.name}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-slate-600">
                      {v.hint}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">Scope</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {SCOPE.map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 flex-none rounded-full bg-slate-400"
                  />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-l-2 border-amber-500 pl-3 text-sm leading-snug text-slate-700">
              Missing or uncertain evidence is reported in the results, never
              guessed.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Cell({
  label,
  placeholder,
  value,
  onChange,
  wide = false,
  large = false,
  multiline = false,
}) {
  const inputClass = `mt-1 block w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none ${
    large ? "text-lg font-medium" : "text-sm"
  }`;

  return (
    <label
      className={`block bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <span className="block text-xs font-medium text-slate-500">{label}</span>
      {multiline ? (
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={inputClass}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
