import { useEffect, useState } from "react";
import { getHistory, deleteHistoryRun } from "../services/api";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null); // State for the Modal

  const loadHistory = () => {
    setLoading(true);
    getHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((e) => {
        alert(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent clicking the delete button from opening the modal
    if (!window.confirm("Are you sure you want to delete this analysis?"))
      return;
    try {
      await deleteHistoryRun(id);
      loadHistory();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  // Group the array by file_name
  const groupedHistory = history.reduce((acc, run) => {
    const file = run.file_name || "Unknown File";
    if (!acc[file]) acc[file] = [];
    acc[file].push(run);
    return acc;
  }, {});

  if (loading) return <p className="text-center mt-10">Loading history...</p>;

  return (
    <div className="space-y-8 relative">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Saved Analyses</h2>
        <p className="text-sm text-slate-500">
          Grouped by uploaded dataset. Click any card to view details.
        </p>
      </div>

      {Object.keys(groupedHistory).length === 0 && (
        <p className="text-slate-500">No analyses saved yet.</p>
      )}

      {Object.entries(groupedHistory).map(([fileName, runs]) => (
        <div
          key={fileName}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Group Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 py-1 px-2 rounded text-xs">
                  PDF
                </span>
                {fileName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {runs.length} analyses from this file
              </p>
            </div>
            <button
              onClick={() =>
                alert(
                  "Original file download requires cloud storage integration (Future Work)."
                )
              }
              className="text-sm border border-slate-300 px-3 py-1 rounded bg-white hover:bg-slate-50 text-slate-700"
            >
              Download Original File
            </button>
          </div>

          {/* Runs inside this group */}
          <div className="divide-y divide-slate-100">
            {runs.map((run) => (
              <div
                key={run.id}
                onClick={() => setSelectedRun(run)} // OPEN MODAL ON CLICK
                className="p-6 flex flex-col md:flex-row gap-6 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                {/* Left Side: Crops & Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">
                        Column {run.column_mark || "—"}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {run.project_title} ({run.project_id}) • Storey:{" "}
                        {run.storey || "—"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Crops Display */}
                  <div className="flex gap-2">
                    {run.view_a_crop && (
                      <img
                        src={run.view_a_crop}
                        alt="Locator"
                        className="h-16 border rounded object-cover"
                        title="Locator"
                      />
                    )}
                    {run.view_b_crop && (
                      <img
                        src={run.view_b_crop}
                        alt="Schedule"
                        className="h-16 border rounded object-cover"
                        title="Schedule"
                      />
                    )}
                    {run.view_c_crop && (
                      <img
                        src={run.view_c_crop}
                        alt="Detail"
                        className="h-16 border rounded object-cover"
                        title="Detail"
                      />
                    )}
                  </div>
                </div>

                {/* Right Side: Rule Results & Delete */}
                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <h5 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                    NSCP Checks
                  </h5>
                  <div className="space-y-2">
                    {run.rule_results?.map((rule) => (
                      <div
                        key={rule.rule_id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-slate-700">{rule.rule_id}</span>
                        <span
                          className={`font-medium ${
                            rule.status === "PRELIMINARILY_COMPLIANT"
                              ? "text-green-600"
                              : rule.status === "PRELIMINARILY_NONCOMPLIANT"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {rule.status.replace("PRELIMINARILY_", "")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => handleDelete(e, run.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete Analysis
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* DETAILED VIEW MODAL */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Column {selectedRun.column_mark} Details
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedRun.file_name} •{" "}
                  {new Date(selectedRun.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 1. High-Res Crops */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">
                  Captured Evidence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedRun.view_a_crop && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        View A (Locator)
                      </p>
                      <img
                        src={selectedRun.view_a_crop}
                        className="w-full rounded border border-slate-200"
                        alt="View A"
                      />
                    </div>
                  )}
                  {selectedRun.view_b_crop && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        View B (Schedule)
                      </p>
                      <img
                        src={selectedRun.view_b_crop}
                        className="w-full rounded border border-slate-200"
                        alt="View B"
                      />
                    </div>
                  )}
                  {selectedRun.view_c_crop && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        View C (Detail)
                      </p>
                      <img
                        src={selectedRun.view_c_crop}
                        className="w-full rounded border border-slate-200"
                        alt="View C"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Detailed Rule Calculations */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">
                  NSCP Rule Details
                </h4>
                <div className="space-y-3">
                  {selectedRun.rule_results?.map((rule) => (
                    <div
                      key={rule.rule_id}
                      className="rounded border border-slate-200 p-4 bg-slate-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {rule.rule_id}
                          </p>
                          <p className="text-xs text-slate-600">{rule.label}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            rule.status === "PRELIMINARILY_COMPLIANT"
                              ? "bg-green-100 text-green-800"
                              : rule.status === "PRELIMINARILY_NONCOMPLIANT"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {rule.status.replace("PRELIMINARILY_", "")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{rule.message}</p>

                      {/* Show Math Details if available */}
                      {rule.details?.ratio_percent !== undefined && (
                        <div className="mt-3 rounded bg-white p-2 text-xs font-mono text-slate-600 border border-slate-200">
                          A_g = {rule.details.gross_area_mm2} mm² | A_st ={" "}
                          {rule.details.steel_area_mm2} mm² | Ratio ={" "}
                          {rule.details.ratio_percent}%
                        </div>
                      )}
                      {rule.details?.allowed_limit_mm !== undefined && (
                        <div className="mt-3 rounded bg-white p-2 text-xs font-mono text-slate-600 border border-slate-200">
                          Limits: 16d_b = {rule.details.limit_by_bar_mm} | 48d_t
                          = {rule.details.limit_by_tie_mm} | Dim ={" "}
                          {rule.details.limit_by_dimension_mm} <br />
                          Strictest Allowed: {rule.details.allowed_limit_mm} mm
                          | Actual: {rule.details.max_spacing_found_mm} mm
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
