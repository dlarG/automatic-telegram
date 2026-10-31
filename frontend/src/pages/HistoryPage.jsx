import { useEffect, useState } from "react";
import { getHistory } from "../services/api";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((e) => {
        alert(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading history...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Saved Analyses</h2>
      {history.length === 0 && <p>No analyses saved yet.</p>}

      {history.map((run) => (
        <div
          key={run.id}
          className="rounded border border-slate-200 bg-white p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">
                Column {run.column_mark} — {run.storey}
              </h3>
              <p className="text-sm text-slate-500">
                Project: {run.project_title} ({run.project_id})
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(run.created_at).toLocaleString()}
            </span>
          </div>

          <div className="mt-3 flex gap-4">
            {run.rule_results?.map((rule) => (
              <div key={rule.rule_id} className="text-sm">
                <span className="font-semibold">{rule.rule_id}:</span>{" "}
                <span
                  className={
                    rule.status === "PRELIMINARILY_COMPLIANT"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {rule.status.replace("PRELIMINARILY_", "")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
