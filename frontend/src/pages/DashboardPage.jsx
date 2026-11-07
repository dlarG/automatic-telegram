import { useState } from "react";
import { pageStyle, FONT_MONO } from "../theme";

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
    <div className="mx-auto max-w-5xl text-[var(--ink)]" style={pageStyle}>
      <header className="mb-8 max-w-2xl">
        <p
          className="text-xs font-medium tracking-widest text-[var(--accent)]"
          style={{ fontFamily: FONT_MONO }}
        >
          NEW PROJECT
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Set up your project
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--muted)]">
          Every field is optional, but what you enter here is printed on the
          final report so each result can be traced back to its drawing.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Title block */}
        <section className="lg:col-span-2">
          <div className="border-2 border-[var(--bp)] bg-[var(--rule)]">
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
              <div className="flex flex-col items-stretch justify-between gap-3 bg-[var(--paper)] px-4 py-3 sm:flex-row sm:items-center md:col-span-2">
                <p className="text-xs text-[var(--muted)]">
                  Next: upload your PDF and capture the three views.
                </p>
                <button
                  onClick={handleStart}
                  className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-ink)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bp)] focus-visible:ring-offset-2"
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
            <h3 className="text-sm font-semibold">
              You'll capture three views
            </h3>
            <ol className="mt-4 space-y-4">
              {VIEWS.map((v) => (
                <li key={v.key} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-sm border border-[var(--bp)] text-sm font-semibold text-[var(--bp)]"
                  >
                    {v.key}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      View {v.key}: {v.name}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--muted)]">
                      {v.hint}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-[var(--rule)] pt-6">
            <h3 className="text-sm font-semibold">Scope</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {SCOPE.map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1 w-1 flex-none rounded-full bg-[var(--muted)]"
                  />
                  {s}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-l-2 border-[var(--accent)] pl-3 text-sm leading-snug">
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
  const inputClass = `mt-1 block w-full bg-transparent text-[var(--ink)] placeholder-slate-400 focus:outline-none ${
    large ? "text-lg font-medium" : "text-sm"
  }`;

  return (
    <label
      className={`block bg-[var(--card)] px-4 py-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--bp)] ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <span className="block text-xs font-medium text-[var(--muted)]">
        {label}
      </span>
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
