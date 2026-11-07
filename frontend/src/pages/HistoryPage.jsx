import { useEffect, useState } from "react";
import { getHistory } from "../services/api";
import { pageStyle, FONT_MONO } from "../theme";

const STATUS = {
  PRELIMINARILY_COMPLIANT: {
    label: "Compliant",
    cell: "border-green-600 bg-green-50 text-green-900",
  },
  PRELIMINARILY_NONCOMPLIANT: {
    label: "Non-compliant",
    cell: "border-red-600 bg-red-50 text-red-900",
  },
  INSUFFICIENT_DOCUMENT_COVERAGE: {
    label: "Insufficient coverage",
    cell: "border-amber-500 bg-amber-50 text-amber-900",
  },
};

/* Edge color of a card = the worst result among its rules */
function worstEdge(rules = []) {
  if (rules.some((r) => r.status === "PRELIMINARILY_NONCOMPLIANT"))
    return "border-l-red-600";
  if (rules.some((r) => r.status === "INSUFFICIENT_DOCUMENT_COVERAGE"))
    return "border-l-amber-500";
  if (rules.length > 0) return "border-l-green-600";
  return "border-l-slate-300";
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Could not load history.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-5xl text-[var(--ink)]" style={pageStyle}>
      <header className="mb-8">
        <p
          className="text-xs font-medium tracking-widest text-[var(--accent)]"
          style={{ fontFamily: FONT_MONO }}
        >
          HISTORY
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Saved analyses
        </h2>
        {!loading && !error && (
          <p className="mt-2 text-[var(--muted)]">
            {history.length === 0
              ? "Nothing saved yet."
              : `${history.length} saved ${
                  history.length === 1 ? "run" : "runs"
                }.`}
          </p>
        )}
      </header>

      {loading && <p className="text-[var(--muted)]">Loading history...</p>}

      {error && (
        <p
          role="alert"
          className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="border-2 border-dashed border-[var(--rule)] bg-[var(--card)] px-6 py-14 text-center">
          <p className="font-medium">No analyses saved yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
            Run an analysis and choose "Save analysis" in step 6. It will show
            up here.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {history.map((run) => (
          <article
            key={run.id}
            className={`border border-[var(--rule)] border-l-4 bg-[var(--card)] p-5 ${worstEdge(
              run.rule_results
            )}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <div className="flex items-start gap-4">
                <span
                  className="flex min-h-[3rem] min-w-[3rem] flex-none items-center justify-center bg-[var(--bp)] px-2 text-lg font-medium text-white"
                  style={{ fontFamily: FONT_MONO }}
                >
                  {run.column_mark || "—"}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    Column {run.column_mark}
                    {run.storey ? ` · ${run.storey}` : ""}
                  </h3>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">
                    {run.project_title}
                    {run.project_id ? ` (${run.project_id})` : ""}
                  </p>
                </div>
              </div>
              <time
                className="text-sm text-[var(--muted)]"
                dateTime={run.created_at}
              >
                {new Date(run.created_at).toLocaleString()}
              </time>
            </div>

            {run.rule_results?.length > 0 && (
              <div className="mt-4 border border-[var(--rule)] bg-[var(--rule)]">
                <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
                  {run.rule_results.map((rule) => {
                    const s = STATUS[rule.status] || {
                      label: rule.status.replace(/_/g, " "),
                      cell: "border-slate-400 bg-slate-100 text-slate-800",
                    };
                    return (
                      <div
                        key={rule.rule_id}
                        className="bg-[var(--card)] px-3 py-2.5"
                      >
                        <p
                          className="text-xs text-[var(--muted)]"
                          style={{ fontFamily: FONT_MONO }}
                        >
                          {rule.rule_id}
                        </p>
                        <span
                          className={`mt-1.5 inline-block border-l-4 px-2 py-0.5 text-xs font-semibold ${s.cell}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
