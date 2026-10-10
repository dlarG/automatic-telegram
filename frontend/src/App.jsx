import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";

const EMPTY_PROJECT = {
  projectId: "",
  title: "",
  sheetId: "",
  preparedBy: "",
  notes: "",
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [project, setProject] = useState(EMPTY_PROJECT);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              RC Column Plan Screening
            </h1>
            <p className="text-xs text-slate-500">
              Preliminary evidence screening prototype — MVP
            </p>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setPage("dashboard")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                page === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setPage("analysis")}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                page === "analysis"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Analysis
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {page === "dashboard" && (
          <DashboardPage
            project={project}
            setProject={setProject}
            onStartAnalysis={() => setPage("analysis")}
          />
        )}

        {page === "analysis" && <AnalysisPage project={project} />}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-8 pt-4 text-center text-xs text-slate-400">
        Preliminary screening only — not a substitute for professional
        engineering judgment.
      </footer>
    </div>
  );
}
