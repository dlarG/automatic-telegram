import { useState } from "react";

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
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Project Setup</h2>
        <p className="mt-1 text-sm text-slate-600">
          Provide basic project information. All fields are optional for the
          prototype but recommended for traceability in the final report.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Project ID"
            placeholder="e.g., P007"
            value={localProject.projectId}
            onChange={(v) => handleChange("projectId", v)}
          />
          <Field
            label="Project Title"
            placeholder="e.g., Three Storey Apartment"
            value={localProject.title}
            onChange={(v) => handleChange("title", v)}
          />
          <Field
            label="Sheet ID (optional)"
            placeholder="e.g., S-10"
            value={localProject.sheetId}
            onChange={(v) => handleChange("sheetId", v)}
          />
          <Field
            label="Prepared By (optional)"
            placeholder="e.g., G. Catina"
            value={localProject.preparedBy}
            onChange={(v) => handleChange("preparedBy", v)}
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700">
            Notes (optional)
          </label>
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Anything worth remembering about this run."
            value={localProject.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleStart}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start New Analysis
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Scope reminder</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>One column and one storey per analysis run.</li>
          <li>User provides the locator and schedule crops.</li>
          <li>
            Deterministic checks only after engineer-validated rules are
            confirmed.
          </li>
          <li>Uncertain or missing evidence is reported, never guessed.</li>
        </ul>
      </section>
    </div>
  );
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type="text"
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
