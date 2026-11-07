import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import ViewSlot from "../components/ViewSlot";
import ColumnIdentityPanel from "../components/ColumnIdentityPanel";
import StepHeader from "../components/StepHeader";
import {
  extractFromBlob,
  extractFromFile,
  mergeViews,
  saveAnalysisRun,
} from "../services/api";

/* Builds and downloads the plain-text screening report. */
function downloadReport(project, merged) {
  let report = `RC COLUMN SCREENING REPORT\n`;
  report += `===========================\n\n`;
  report += `Project: ${project?.title || "Unknown"}\n`;
  report += `Column Mark: ${merged.column_mark}\n`;
  report += `Dimensions: ${merged.width_mm} x ${merged.depth_mm} mm\n`;
  report += `Main Bars: ${merged.bar_count} - ${merged.bar_diameter_mm}mm\n`;
  report += `Ties: ${merged.tie_diameter_mm}mm @ ${merged.tie_spacing_mm}mm\n\n`;

  report += `ENGINEERING CHECKS (NSCP 2015)\n`;
  report += `-----------------------------\n`;
  merged.rule_results?.forEach((rule) => {
    report += `[${rule.status}] ${rule.label}\n`;
    report += `   ${rule.message}\n\n`;
  });

  report += `Disclaimer: This is a preliminary automated screening only. It does not replace professional engineering judgment.`;

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Screening_Report_${merged.column_mark || "Column"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalysisPage({ project }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState("");
  const [merged, setMerged] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");

  const [viewA, setViewA] = useState({ blob: null, url: "" });
  const [viewB, setViewB] = useState({ blob: null, url: "" });
  const [viewC, setViewC] = useState({ blob: null, url: "" });

  const [identity, setIdentity] = useState({
    columnMark: "",
    storey: "",
    gridX: "",
    gridY: "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!merged) return;
    setSaving(true);
    setSaveError("");
    try {
      await saveAnalysisRun({
        project_id: project.projectId,
        project_title: project.title,
        sheet_id: project.sheetId,
        prepared_by: project.preparedBy,
        column_mark: identity.columnMark,
        storey: identity.storey,
        grid_x: identity.gridX,
        grid_y: identity.gridY,
        merged_fields: merged,
        rule_results: merged.rule_results,
      });
      setSaved(true);
    } catch (e) {
      setSaveError("Could not save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const [extraction, setExtraction] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const isPdf = fileType === "application/pdf";

  const runMerge = async () => {
    if (!extraction) {
      setMergeError("Run extraction first.");
      return;
    }
    setMerging(true);
    setMergeError("");
    try {
      // Build the views payload from whatever extraction results exist
      const views = {};
      for (const key of ["A", "B", "C"]) {
        if (extraction[key]?.extracted_fields) {
          views[key] = { extracted_fields: extraction[key].extracted_fields };
        }
      }
      const caseId = `${project.projectId || "P001"}-${
        identity.columnMark || "C1"
      }`;
      const result = await mergeViews(caseId, views);
      setMerged(result);
      setSaved(false); // a new merge result can be saved again
      setSaveError("");
    } catch (e) {
      setMergeError(e.message || "Merge failed.");
    } finally {
      setMerging(false);
    }
  };

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
    <div className="mx-auto max-w-6xl space-y-10">
      {project.projectId && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-4 border-slate-800 bg-white px-4 py-2.5">
          <span className="text-sm font-semibold text-slate-900">
            {project.projectId}
          </span>
          {project.title && (
            <span className="text-sm text-slate-700">{project.title}</span>
          )}
          {project.sheetId && (
            <span className="text-sm text-slate-500">
              Sheet {project.sheetId}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UploadPanel
          file={file}
          setFile={setFile}
          fileType={fileType}
          setFileType={setFileType}
          error={error}
          setError={setError}
        />
        <ColumnIdentityPanel identity={identity} setIdentity={setIdentity} />
      </div>

      <section>
        <StepHeader
          step={3}
          title="Capture the views"
          hint="Draw a box around each region on the sheet. Views A and B are required; C is optional."
        />
        <div className="mt-4 space-y-6">
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
      </section>

      <ActionStep
        step={4}
        title="Run extraction"
        hint="Send the captured views to the backend to read the text and parse the fields."
        button={running ? "Running..." : "Run extraction"}
        onClick={runExtraction}
        disabled={running || !file}
        note={
          file && !isPdf
            ? "Image mode: View B will use the uploaded image."
            : null
        }
        error={runError}
      />

      {extraction && (
        <ActionStep
          step={5}
          title="Merge views"
          hint="Combine the extracted fields from Views A, B and C into one set. Conflicts are reported, not resolved."
          button={merging ? "Merging..." : "Merge views"}
          onClick={runMerge}
          disabled={merging}
          error={mergeError}
        />
      )}

      {merged && <MergedResultCard merged={merged} />}

      {merged && (
        <ExportStep
          merged={merged}
          saving={saving}
          saved={saved}
          saveError={saveError}
          onSave={handleSave}
          onDownload={() => downloadReport(project, merged)}
        />
      )}

      {extraction && <ExtractionResults extraction={extraction} />}
    </div>
  );
}

function ActionStep({
  step,
  title,
  hint,
  button,
  onClick,
  disabled,
  note,
  error,
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StepHeader step={step} title={title} hint={hint} />
        <div className="flex flex-none items-center gap-3 sm:pl-6">
          {note && <span className="text-xs text-slate-500">{note}</span>}
          <button
            onClick={onClick}
            disabled={disabled}
            className="rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {button}
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
    </section>
  );
}

/* Step 6: result summary, save to database, download report */
function ExportStep({ merged, saving, saved, saveError, onSave, onDownload }) {
  const rules = merged.rule_results || [];
  const count = (status) => rules.filter((r) => r.status === status).length;

  const summary = [
    ["Compliant", count("PRELIMINARILY_COMPLIANT"), "border-green-600"],
    ["Non-compliant", count("PRELIMINARILY_NONCOMPLIANT"), "border-red-600"],
    [
      "Insufficient coverage",
      count("INSUFFICIENT_DOCUMENT_COVERAGE"),
      "border-amber-500",
    ],
  ];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <StepHeader
        step={6}
        title="Save and export"
        hint="Store this run in the database, then download the screening report."
      />

      {rules.length > 0 && (
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summary.map(([label, n, edge]) => (
            <div
              key={label}
              className={`border border-slate-200 border-l-4 bg-slate-50 px-4 py-3 ${edge}`}
            >
              <dd className="text-2xl font-semibold text-slate-900">{n}</dd>
              <dt className="text-sm text-slate-600">{label}</dt>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 border border-slate-200 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Save analysis
            </h4>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              Saves the project, column identity, merged fields and check
              results to the database.
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saving || saved}
            className={`self-start rounded px-5 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              saved
                ? "border border-green-600 bg-green-50 text-green-900 focus-visible:ring-green-600"
                : "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-700 disabled:bg-slate-300 disabled:text-slate-500"
            }`}
          >
            {saved
              ? "✓ Saved to database"
              : saving
              ? "Saving..."
              : "Save analysis"}
          </button>
        </div>

        <div className="flex flex-col justify-between gap-4 border border-slate-200 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Download report
            </h4>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              A plain-text report with the column, its dimensions and each NSCP
              2015 check.
            </p>
          </div>
          <button
            onClick={onDownload}
            className="self-start rounded border border-slate-800 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2"
          >
            Download report
          </button>
        </div>
      </div>

      {saveError && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {saveError}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mt-4 border-l-2 border-green-600 bg-green-50 px-3 py-2 text-sm text-green-900"
        >
          Analysis saved to the database.
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Preliminary automated screening only. It does not replace professional
        engineering judgment.
      </p>
    </section>
  );
}

/* Shared "title block" grid used by both result cards */
function FieldGrid({ fields }) {
  return (
    <div className="border-2 border-slate-800 bg-slate-300">
      <div className="grid grid-cols-2 gap-px md:grid-cols-4">
        {fields.map(([label, value]) => {
          const empty = value === null || value === undefined || value === "";
          return (
            <div key={label} className="bg-white px-3 py-2.5">
              <p className="text-xs text-slate-500">{label}</p>
              <p
                className={`mt-0.5 text-base font-semibold ${
                  empty ? "text-slate-300" : "text-slate-900"
                }`}
              >
                {empty ? "—" : value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  PRELIMINARILY_COMPLIANT: "border-green-600 bg-green-50 text-green-900",
  PRELIMINARILY_NONCOMPLIANT: "border-red-600 bg-red-50 text-red-900",
  INSUFFICIENT_DOCUMENT_COVERAGE: "border-amber-500 bg-amber-50 text-amber-900",
};

function MergedResultCard({ merged }) {
  const fields = [
    ["Column mark", merged.column_mark],
    ["Width (mm)", merged.width_mm],
    ["Depth (mm)", merged.depth_mm],
    ["Bar count", merged.bar_count],
    ["Bar diameter (mm)", merged.bar_diameter_mm],
    ["Tie diameter (mm)", merged.tie_diameter_mm],
    ["Tie spacing (mm)", merged.tie_spacing_mm],
  ];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Merged field set
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Confirmed values, with the source view recorded for each field.
          </p>
        </div>
        <span className="rounded-sm border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-900">
          Confidence: {merged.merge_confidence}
        </span>
      </div>

      <div className="mt-4">
        <FieldGrid fields={fields} />
      </div>

      {merged.zone_spacings?.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold text-slate-900">
            Zone spacings
          </h4>
          <ul className="mt-2 divide-y divide-slate-100 border-y border-slate-100">
            {merged.zone_spacings.map((z, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 text-sm text-slate-700"
              >
                <span>Zone {z.zone}</span>
                <span className="font-medium text-slate-900">
                  {z.spacing_mm} mm{z.count ? ` (x${z.count})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {merged.conflicts?.length > 0 && (
        <div className="mt-5 border-l-2 border-red-600 bg-red-50 px-4 py-3">
          <h4 className="text-sm font-semibold text-red-900">Conflicts</h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-red-800">
            {merged.conflicts.map((c, i) => (
              <li key={i}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {merged.merge_warnings?.length > 0 && (
        <div className="mt-5 border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
          <h4 className="text-sm font-semibold text-amber-900">Warnings</h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-800">
            {merged.merge_warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {merged.rule_results?.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h4 className="text-base font-semibold text-slate-900">
            Engineering checks
          </h4>
          <div className="mt-4 space-y-3">
            {merged.rule_results.map((rule) => (
              <div
                key={rule.rule_id}
                className="rounded-sm border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {rule.rule_id}: {rule.label}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-slate-600">
                      {rule.message}
                    </p>
                  </div>
                  <span
                    className={`flex-none self-start whitespace-nowrap rounded-sm border-l-4 px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[rule.status] ||
                      "border-slate-400 bg-slate-100 text-slate-800"
                    }`}
                  >
                    {rule.status.replace(/_/g, " ")}
                  </span>
                </div>

                {rule.details?.ratio_percent !== undefined && (
                  <div className="mt-3 grid grid-cols-3 gap-px border border-slate-300 bg-slate-300 text-center">
                    <Calc
                      label="Gross area A_g"
                      value={`${rule.details.gross_area_mm2} mm²`}
                    />
                    <Calc
                      label="Steel area A_st"
                      value={`${rule.details.steel_area_mm2} mm²`}
                    />
                    <Calc
                      label="Ratio"
                      value={`${rule.details.ratio_percent}%`}
                    />
                  </div>
                )}

                {rule.details?.allowed_limit_mm !== undefined && (
                  <div className="mt-3 space-y-px border border-slate-300 bg-slate-300">
                    <div className="grid grid-cols-3 gap-px text-center">
                      <Calc
                        label="Limit by bar (16d_b)"
                        value={`${rule.details.limit_by_bar_mm} mm`}
                      />
                      <Calc
                        label="Limit by tie (48d_t)"
                        value={`${rule.details.limit_by_tie_mm} mm`}
                      />
                      <Calc
                        label="Limit by dimension"
                        value={`${rule.details.limit_by_dimension_mm} mm`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-px text-center">
                      <Calc
                        label="Strictest allowed limit"
                        value={`${rule.details.allowed_limit_mm} mm`}
                        strong
                      />
                      <Calc
                        label="Max spacing found"
                        value={`${rule.details.max_spacing_found_mm} mm`}
                        strong
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
          Provenance per field
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(merged.field_provenance, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function Calc({ label, value, strong = false }) {
  return (
    <div className={strong ? "bg-white px-2 py-2.5" : "bg-slate-50 px-2 py-2"}>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`font-semibold text-slate-900 ${
          strong ? "text-base" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ExtractionResults({ extraction }) {
  return (
    <div className="space-y-6">
      {Object.entries(extraction).map(([key, data]) => (
        <section
          key={key}
          className="rounded-md border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 flex-none items-center justify-center rounded-sm bg-slate-900 text-sm font-semibold text-white"
            >
              {key}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900">
                View {key} extraction
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                Mode: {data.extraction?.mode}
                {data.extraction?.message
                  ? ` · ${data.extraction.message}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <FieldGrid
              fields={[
                ["Column mark", data.extracted_fields?.column_mark],
                ["Width (mm)", data.extracted_fields?.width_mm],
                ["Depth (mm)", data.extracted_fields?.depth_mm],
                ["Bar count", data.extracted_fields?.bar_count],
                ["Bar diameter (mm)", data.extracted_fields?.bar_diameter_mm],
                ["Tie diameter (mm)", data.extracted_fields?.tie_diameter_mm],
                ["Tie spacing (mm)", data.extracted_fields?.tie_spacing_mm],
                ["Parse confidence", data.extracted_fields?.parse_confidence],
              ]}
            />
          </div>

          {data.extracted_fields?.parse_warnings?.length > 0 && (
            <div className="mt-4 border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Warnings</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-800">
                {data.extracted_fields.parse_warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
              Show raw text ({data.raw_text?.length || 0} characters)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {data.raw_text?.slice(0, 2000) || "(empty)"}
            </pre>
          </details>
        </section>
      ))}
    </div>
  );
}
