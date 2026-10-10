import { RESULT_STATUS_LABELS } from "../mock/mockExtraction";

export default function ResultsPanel({ checks }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Preliminary Check Results
        </h3>
        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          Mock Only
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Placeholder results. The real rule engine waits for the
        engineer-validated rule specification.
      </p>

      <div className="mt-3 space-y-3">
        {checks.map((check) => {
          const status = RESULT_STATUS_LABELS[check.status] || {
            label: check.status,
            color: "bg-slate-100 text-slate-700 border-slate-200",
          };
          return (
            <div
              key={check.id}
              className="rounded border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    {check.id} — {check.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {check.nscpRef}
                  </p>
                </div>
                <span
                  className={`whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{check.message}</p>
              {check.evidenceFieldIds?.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Evidence fields: {check.evidenceFieldIds.join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
