import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import ViewSlot from "../components/ViewSlot";
import ColumnIdentityPanel from "../components/ColumnIdentityPanel";
import { extractFromBlob, extractFromFile } from "../services/api";

export default function AnalysisPage({ project }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState("");

  const [viewA, setViewA] = useState({ blob: null, url: "" });
  const [viewB, setViewB] = useState({ blob: null, url: "" });
  const [viewC, setViewC] = useState({ blob: null, url: "" });

  const [identity, setIdentity] = useState({
    columnMark: "",
    storey: "",
    gridX: "",
    gridY: "",
  });

  const [extraction, setExtraction] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const isPdf = fileType === "application/pdf";

  // ---- Run extraction ----
  const runExtraction = async () => {
    setRunError("");
    setExtraction(null);

    if (!file) {
      setRunError("Please upload a source document first.");
      return;
    }

    setRunning(true);
    try {
      const results = {};

      // Send View A (locator) — informational, parser will extract column mark
      if (isPdf && viewA.blob) {
        results.A = await extractFromBlob(viewA.blob, "viewA.png", "A");
      } else if (file && !isPdf) {
        results.A = await extractFromFile(file, "A");
      } else if (file && isPdf && !viewA.blob) {
        // No crop yet — send whole PDF as fallback
        results.A = await extractFromFile(file, "A");
      }

      // Send View B (schedule) — primary source for fields
      if (isPdf && viewB.blob) {
        results.B = await extractFromBlob(viewB.blob, "viewB.png", "B");
      }

      // Send View C (detail) — optional
      if (isPdf && viewC.blob) {
        results.C = await extractFromBlob(viewC.blob, "viewC.png", "C");
      }

      setExtraction(results);
    } catch (e) {
      setRunError(e.message || "Unknown error during extraction.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {project.projectId && (
        <div className="rounded border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
          Project:{" "}
          <span className="font-mono text-slate-800">{project.projectId}</span>
          {project.title ? ` — ${project.title}` : ""}
          {project.sheetId ? ` · Sheet ${project.sheetId}` : ""}
        </div>
      )}

      <UploadPanel
        file={file}
        setFile={setFile}
        fileType={fileType}
        setFileType={setFileType}
        error={error}
        setError={setError}
      />

      <ColumnIdentityPanel identity={identity} setIdentity={setIdentity} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ViewSlot
          label="A"
          description="Locator / context"
          required
          pdfFile={isPdf ? file : null}
          capturedImage={viewA.url}
          onCapture={(blob, url) => setViewA({ blob, url })}
          onClear={() => setViewA({ blob: null, url: "" })}
        />
        <ViewSlot
          label="B"
          description="Column schedule cell"
          required
          pdfFile={isPdf ? file : null}
          capturedImage={viewB.url}
          onCapture={(blob, url) => setViewB({ blob, url })}
          onClear={() => setViewB({ blob: null, url: "" })}
        />
        <ViewSlot
          label="C"
          description="Supporting detail / note"
          required={false}
          pdfFile={isPdf ? file : null}
          capturedImage={viewC.url}
          onCapture={(blob, url) => setViewC({ blob, url })}
          onClear={() => setViewC({ blob: null, url: "" })}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Run Extraction</h3>
        <p className="mt-1 text-xs text-slate-500">
          Send the captured views to the backend for text extraction and field
          parsing.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={runExtraction}
            disabled={running || !file}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {running ? "Running..." : "Run Extraction"}
          </button>
          {file && !isPdf && (
            <span className="text-xs text-slate-500">
              (Image mode: View B will use the uploaded image.)
            </span>
          )}
        </div>

        {runError && (
          <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {runError}
          </p>
        )}
      </div>

      {extraction && <ExtractionResults extraction={extraction} />}
    </div>
  );
}

function ExtractionResults({ extraction }) {
  return (
    <div className="space-y-4">
      {Object.entries(extraction).map(([key, data]) => (
        <div
          key={key}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            View {key} — Extraction
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Mode: <span className="font-mono">{data.extraction?.mode}</span> ·{" "}
            {data.extraction?.message}
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <FieldRow
              label="Column mark"
              value={data.extracted_fields?.column_mark}
            />
            <FieldRow
              label="Width (mm)"
              value={data.extracted_fields?.width_mm}
            />
            <FieldRow
              label="Depth (mm)"
              value={data.extracted_fields?.depth_mm}
            />
            <FieldRow
              label="Bar count"
              value={data.extracted_fields?.bar_count}
            />
            <FieldRow
              label="Bar diameter (mm)"
              value={data.extracted_fields?.bar_diameter_mm}
            />
            <FieldRow
              label="Tie diameter (mm)"
              value={data.extracted_fields?.tie_diameter_mm}
            />
            <FieldRow
              label="Tie spacing (mm)"
              value={data.extracted_fields?.tie_spacing_mm}
            />
            <FieldRow
              label="Parse confidence"
              value={data.extracted_fields?.parse_confidence}
            />
          </div>

          {data.extracted_fields?.parse_warnings?.length > 0 && (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">Warnings</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
                {data.extracted_fields.parse_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-500">
              Show raw text ({data.raw_text?.length || 0} chars)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs">
              {data.raw_text?.slice(0, 2000) || "(empty)"}
            </pre>
          </details>
        </div>
      ))}
    </div>
  );
}

function FieldRow({ label, value }) {
  const display =
    value === null || value === undefined || value === "" ? "—" : value;
  return (
    <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{display}</span>
    </div>
  );
}
