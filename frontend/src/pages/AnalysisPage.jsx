import { useState, useEffect } from "react";
import UploadPanel from "../components/UploadPanel";
import ViewSlot from "../components/ViewSlot";
import ColumnIdentityPanel from "../components/ColumnIdentityPanel";
import StepHeader from "../components/StepHeader";
import {
  extractFromBlob,
  extractFromFile,
  mergeViews,
  saveAnalysisRun,
  reanalyzeFields,
} from "../services/api";

async function downloadReport(project, merged) {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const response = await fetch(`${API_URL}/api/reports/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
        merged,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate PDF report.";

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Keep the default error message.
      }

      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    const contentDisposition = response.headers.get("Content-Disposition");

    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);

    const filename =
      filenameMatch?.[1] ||
      `RC_Screening_Report_${merged.column_mark || "Column"}.pdf`;

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("PDF export error:", error);

    alert(error.message || "Unable to generate the PDF report.");
  }
}

export default function AnalysisPage({ project }) {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState("");
  const [merged, setMerged] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

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

    // Read the correct session key used by App.jsx
    const savedUser = localStorage.getItem("rc_user");
    // eslint-disable-next-line no-useless-assignment
    let user = null;

    try {
      user = savedUser ? JSON.parse(savedUser) : null;
    } catch {
      // In case an old session stored only a username string
      user = null;
    }

    if (!user?.id) {
      alert("User session not found. Please log in again.");
      return;
    }

    setSaving(true);

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

    try {
      const base64A = viewA.blob ? await toBase64(viewA.blob) : null;
      const base64B = viewB.blob ? await toBase64(viewB.blob) : null;
      const base64C = viewC.blob ? await toBase64(viewC.blob) : null;

      await saveAnalysisRun({
        user_id: user.id,

        project_id: project.projectId,
        project_title: project.title,
        sheet_id: project.sheetId,

        file_name: file ? file.name : "Image Upload",

        view_a_crop: base64A,
        view_b_crop: base64B,
        view_c_crop: base64C,

        column_mark: identity.columnMark,
        storey: identity.storey,
        grid_x: identity.gridX,
        grid_y: identity.gridY,

        merged_fields: merged,
        rule_results: merged.rule_results,
      });

      setSaved(true);
      alert("Analysis saved to database!");
    } catch (e) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const [extraction, setExtraction] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");

  const isPdf = fileType === "application/pdf";

  // Update image preview when a new file is uploaded
  useEffect(() => {
    if (file && !isPdf) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url); // Cleanup memory
    } else {
      setImagePreviewUrl("");
    }
  }, [file, isPdf]);

  const runMerge = async () => {
    if (!extraction) {
      setMergeError("Run extraction first.");
      return;
    }

    setMerging(true);
    setMergeError("");

    try {
      const views = {};

      for (const key of ["A", "B", "C"]) {
        if (extraction[key]) {
          views[key] = {
            extracted_fields: extraction[key].extracted_fields || {},
            raw_text: extraction[key].raw_text || "",
          };
        }
      }

      const caseId = `${project.projectId || "P001"}-${
        identity.columnMark || "C1"
      }`;

      const result = await mergeViews(caseId, views);

      setMerged(result);
      setSaved(false);
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

    // Check if we have a source document OR at least one captured view
    if (!file && !viewA.blob && !viewB.blob && !viewC.blob) {
      setRunError(
        "Please upload a source document or capture at least one view."
      );
      return;
    }

    setRunning(true);
    try {
      const results = {};

      // Send View A
      if (viewA.blob) {
        results.A = await extractFromBlob(viewA.blob, "viewA.png", "A");
      } else if (file && !isPdf) {
        results.A = await extractFromFile(file, "A");
      } else if (file && isPdf && !viewA.blob) {
        results.A = await extractFromFile(file, "A");
      }

      // Send View B (This now works whether it's from PDF crop or Image upload)
      if (viewB.blob) {
        results.B = await extractFromBlob(viewB.blob, "viewB.png", "B");
      }

      // Send View C
      if (viewC.blob) {
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
            imageUrl={!isPdf ? imagePreviewUrl : null}
            capturedImage={viewA.url}
            onCapture={(blob, url) => setViewA({ blob, url })}
            onClear={() => setViewA({ blob: null, url: "" })}
          />
          <ViewSlot
            label="B"
            description="Column schedule cell"
            required
            pdfFile={isPdf ? file : null}
            imageUrl={!isPdf ? imagePreviewUrl : null}
            capturedImage={viewB.url}
            onCapture={(blob, url) => setViewB({ blob, url })}
            onClear={() => setViewB({ blob: null, url: "" })}
          />
          <ViewSlot
            label="C"
            description="Supporting detail / note"
            required={false}
            pdfFile={isPdf ? file : null}
            imageUrl={!isPdf ? imagePreviewUrl : null}
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

      {merged && (
        <MergedResultCard
          merged={merged}
          extraction={extraction}
          onMergedUpdate={(updated) => {
            setMerged(updated);
            setSaved(false);
            setSaveError("");
          }}
        />
      )}

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
        hint="Store this run in the database or generate a PDF screening report."
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
        {/* Save Analysis */}
        <div className="flex flex-col justify-between gap-4 border border-slate-200 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Save analysis
            </h4>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              Saves the project, column identity, merged fields and screening
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

        {/* Generate PDF */}
        <div className="flex flex-col justify-between gap-4 border border-slate-200 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Generate PDF report
            </h4>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              Generate a formatted engineering screening report containing
              project information, NSCP checks, calculation details,
              recommendations and assumptions.
            </p>
          </div>

          <button
            onClick={onDownload}
            disabled={rules.length === 0}
            className="self-start rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Download PDF report
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

function MergedResultCard({ merged, extraction, onMergedUpdate }) {
  const [editing, setEditing] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const createDraft = (data) => ({
    column_mark: data.column_mark ?? "",
    width_mm: data.width_mm ?? "",
    depth_mm: data.depth_mm ?? "",
    bar_count: data.bar_count ?? "",
    bar_diameter_mm: data.bar_diameter_mm ?? "",
    tie_diameter_mm: data.tie_diameter_mm ?? "",
    tie_spacing_mm: data.tie_spacing_mm ?? "",
    zone_spacings: (data.zone_spacings || [])
      .map((z) => z.spacing_mm)
      .join(", "),
  });

  const [draft, setDraft] = useState(() => createDraft(merged));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(createDraft(merged));
  }, [merged]);

  const updateDraft = (field, value) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const cancelEditing = () => {
    setDraft(createDraft(merged));
    setEditing(false);
    setEditError("");
    setEditSuccess("");
  };

  const handleReanalyze = async () => {
    setEditError("");
    setEditSuccess("");

    // Convert numeric inputs and validate them before sending.
    const numericFields = [
      "width_mm",
      "depth_mm",
      "bar_count",
      "bar_diameter_mm",
      "tie_diameter_mm",
      "tie_spacing_mm",
    ];

    const updatedFields = {};

    for (const field of numericFields) {
      const rawValue = draft[field];

      if (rawValue === "") {
        updatedFields[field] = null;
        continue;
      }

      const number = Number(rawValue);

      if (!Number.isFinite(number) || number <= 0) {
        setEditError(`${field.replace(/_/g, " ")} must be a positive number.`);
        return;
      }

      if (field === "bar_count" && !Number.isInteger(number)) {
        setEditError("Bar count must be a whole number.");
        return;
      }

      updatedFields[field] = number;
    }

    // Validate and convert the column mark.
    updatedFields.column_mark = draft.column_mark.trim() || null;

    // Convert comma-separated zone spacings into the structure
    // expected by the existing tie-spacing rule.
    let updatedZones = [];

    if (draft.zone_spacings.trim()) {
      const spacingValues = draft.zone_spacings
        .split(",")
        .map((value) => value.trim());

      for (const value of spacingValues) {
        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) {
          setEditError(
            "Zone spacings must contain only positive numbers separated by commas."
          );
          return;
        }

        updatedZones.push(number);
      }

      updatedZones = updatedZones.map((spacing, index) => ({
        zone: `Manual ${index + 1}`,
        spacing_mm: spacing,
      }));
    }

    updatedFields.zone_spacings = updatedZones;

    // Keep the original OCR text for the readability check.
    const viewTexts = {
      A: extraction?.A?.raw_text || "",
      B: extraction?.B?.raw_text || "",
      C: extraction?.C?.raw_text || "",
    };

    // Identify fields that have actually changed.
    const fieldsToTrack = ["column_mark", ...numericFields, "zone_spacings"];

    const changedFields = fieldsToTrack.filter((field) => {
      if (field === "zone_spacings") {
        const oldValues = (merged.zone_spacings || []).map((z) =>
          Number(z.spacing_mm)
        );
        const newValues = updatedZones.map((z) => Number(z.spacing_mm));

        return JSON.stringify(oldValues) !== JSON.stringify(newValues);
      }

      const oldValue = merged[field] ?? null;
      const newValue = updatedFields[field] ?? null;

      if (field === "column_mark") {
        return String(oldValue || "") !== String(newValue || "");
      }

      if (oldValue === null && newValue === null) return false;

      return Number(oldValue) !== Number(newValue);
    });

    setReanalyzing(true);

    try {
      const response = await reanalyzeFields(updatedFields, viewTexts);

      // Preserve original provenance and identify manual corrections.
      const updatedProvenance = {
        ...(merged.field_provenance || {}),
      };

      const manualOverrides = {
        ...(merged.manual_overrides || {}),
      };

      for (const field of changedFields) {
        updatedProvenance[field] = "MANUAL";

        manualOverrides[field] = {
          original_value:
            merged[field] ??
            (field === "zone_spacings" ? merged.zone_spacings || [] : null),
          manual_value:
            field === "zone_spacings" ? updatedZones : updatedFields[field],
        };
      }

      // Build the complete updated result while retaining merge metadata.
      const updatedMerged = {
        ...merged,
        ...response.merged_fields,
        field_provenance: updatedProvenance,
        manual_overrides: manualOverrides,
        rule_results: response.rule_results,
      };

      onMergedUpdate(updatedMerged);

      setDraft(createDraft(updatedMerged));
      setEditing(false);
      setEditSuccess(
        "Fields updated and engineering checks recalculated successfully."
      );
    } catch (error) {
      setEditError(error.message || "Unable to re-analyze the updated fields.");
    } finally {
      setReanalyzing(false);
    }
  };

  const fields = [
    ["Column mark", merged.column_mark],
    ["Width (mm)", merged.width_mm],
    ["Depth (mm)", merged.depth_mm],
    ["Bar count", merged.bar_count],
    ["Bar diameter (mm)", merged.bar_diameter_mm],
    ["Tie diameter (mm)", merged.tie_diameter_mm],
    ["Tie spacing (mm)", merged.tie_spacing_mm],
  ];

  const editableFields = [
    { key: "column_mark", label: "Column mark", type: "text" },
    { key: "width_mm", label: "Width (mm)", type: "number" },
    { key: "depth_mm", label: "Depth (mm)", type: "number" },
    { key: "bar_count", label: "Bar count", type: "number", step: "1" },
    {
      key: "bar_diameter_mm",
      label: "Bar diameter (mm)",
      type: "number",
    },
    {
      key: "tie_diameter_mm",
      label: "Tie diameter (mm)",
      type: "number",
    },
    {
      key: "tie_spacing_mm",
      label: "General tie spacing (mm)",
      type: "number",
    },
  ];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Merged field set
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Confirmed values, with the source view recorded for each field.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-900">
            Weighted field coverage:{" "}
            {(
              (merged.merge_completeness ?? merged.merge_confidence ?? 0) * 100
            ).toFixed(0)}
            %
          </span>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(createDraft(merged));
                setEditing(true);
                setEditError("");
                setEditSuccess("");
              }}
              className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Edit Fields
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Weighted coverage measures populated structural fields. It does not
        guarantee the correctness of extracted values.
      </p>

      {/* Edit form */}
      {editing && (
        <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Correct or supply structural fields
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Enter the values shown in the structural drawing. Leave a field
              blank if its value is unknown. Re-analysis will use these values
              to recalculate the engineering checks.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editableFields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">
                  {field.label}
                </span>
                <input
                  type={field.type}
                  step={field.step || "any"}
                  min={field.type === "number" ? "0" : undefined}
                  value={draft[field.key]}
                  onChange={(event) =>
                    updateDraft(field.key, event.target.value)
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
          </div>

          {/* Zone spacing editor */}
          <div className="mt-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Zone spacings (mm)
              </span>
              <input
                type="text"
                value={draft.zone_spacings}
                onChange={(event) =>
                  updateDraft("zone_spacings", event.target.value)
                }
                placeholder="Example: 50, 100, 150"
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Enter comma-separated spacing values. These are used by the
                tie-spacing check instead of general tie spacing when supplied.
                Leave blank to use general tie spacing.
              </span>
            </label>
          </div>

          {editError && (
            <p
              role="alert"
              className="mt-4 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {editError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="rounded bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {reanalyzing
                ? "Re-analyzing..."
                : "Save Corrections & Re-analyze"}
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              disabled={reanalyzing}
              className="rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editSuccess && (
        <p
          role="status"
          className="mt-4 border-l-2 border-green-600 bg-green-50 px-3 py-2 text-sm text-green-900"
        >
          {editSuccess}
        </p>
      )}

      {/* Merged fields */}
      <div className="mt-4">
        <FieldGrid fields={fields} />
      </div>
      {Object.entries(merged.field_provenance || {}).some(
        ([, source]) => source === "MANUAL"
      ) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Manually supplied:
          </span>

          {Object.entries(merged.field_provenance || {})
            .filter(([, source]) => source === "MANUAL")
            .map(([field]) => (
              <span
                key={field}
                className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
              >
                {field.replace(/_/g, " ")} · MANUAL
              </span>
            ))}
        </div>
      )}

      {/* Zone spacings */}
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
                <span>Zone {z.zone || i + 1}</span>
                <span className="font-medium text-slate-900">
                  {z.spacing_mm} mm
                  {z.count ? ` (x${z.count})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts */}
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

      {/* Warnings */}
      {merged.merge_warnings?.length > 0 && (
        <div className="mt-5 border-l-2 border-amber-500 bg-amber-50 px-4 py-3">
          <h4 className="text-sm font-semibold text-amber-900">
            Merge warnings
          </h4>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-amber-800">
            {merged.merge_warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Engineering checks */}
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

                {rule.rule_id === "REBAR-RATIO-01" &&
                  rule.details?.ratio_percent !== undefined && (
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

                {rule.rule_id === "C3-TIE-SPACING" &&
                  rule.details?.allowed_limit_mm !== undefined && (
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

                {rule.rule_id === "C7-CLEAR-SPACING" &&
                  rule.details?.estimated_clear_spacing_mm !== undefined && (
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                      <div className="text-center">
                        <span className="block text-slate-400">
                          Required Min
                        </span>
                        <span className="font-mono font-medium">
                          {rule.details.required_min_mm} mm
                        </span>
                      </div>
                      <div className="border-l border-slate-200 text-center">
                        <span className="block text-slate-400">
                          Estimated Actual
                        </span>
                        <span className="font-mono font-medium">
                          {rule.details.estimated_clear_spacing_mm} mm
                        </span>
                      </div>
                    </div>
                  )}

                {rule.rule_id === "C8-LATERAL-SUPPORT" &&
                  rule.details?.average_spacing_mm !== undefined && (
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                      <div className="text-center">
                        <span className="block text-slate-400">
                          Allowed Limit
                        </span>
                        <span className="font-mono font-medium">
                          {rule.details.allowed_limit_mm} mm
                        </span>
                      </div>
                      <div className="border-l border-slate-200 text-center">
                        <span className="block text-slate-400">
                          Average Perimeter Spacing
                        </span>
                        <span className="font-mono font-medium">
                          {rule.details.average_spacing_mm} mm
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
          Provenance per field
        </summary>
        <pre className="mt-2 max-h-72 overflow-auto rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(merged.field_provenance, null, 2)}
        </pre>
      </details>

      {/* Manual override history */}
      {Object.keys(merged.manual_overrides || {}).length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
            Manual correction history
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-sm border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(merged.manual_overrides, null, 2)}
          </pre>
        </details>
      )}
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
                [
                  "Extraction completeness",
                  data.extracted_fields?.extraction_completeness,
                ],
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
