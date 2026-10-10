import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import DrawingPreview from "../components/DrawingPreview";
import ColumnIdentityPanel from "../components/ColumnIdentityPanel";
import ExtractedFieldsPanel from "../components/ExtractedFieldsPanel";
import ResultsPanel from "../components/ResultsPanel";
import { MOCK_EXTRACTION } from "../mock/mockExtraction";

export default function AnalysisPage({ project }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState("");
  const [region, setRegion] = useState(null);

  const [identity, setIdentity] = useState({
    columnMark: MOCK_EXTRACTION.columnId,
    storey: MOCK_EXTRACTION.storey,
    gridX: MOCK_EXTRACTION.gridX,
    gridY: MOCK_EXTRACTION.gridY,
  });

  const [fields, setFields] = useState(MOCK_EXTRACTION.extractedFields);

  const confirmedCount = fields.filter((f) => f.userConfirmed).length;

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UploadPanel
            file={file}
            setFile={setFile}
            previewUrl={previewUrl}
            setPreviewUrl={setPreviewUrl}
            fileType={fileType}
            setFileType={setFileType}
            error={error}
            setError={setError}
          />
          <DrawingPreview
            previewUrl={previewUrl}
            fileType={fileType}
            fileName={file?.name}
            region={region}
            setRegion={setRegion}
          />
        </div>

        <div className="space-y-6">
          <ColumnIdentityPanel identity={identity} setIdentity={setIdentity} />
          <ExtractedFieldsPanel fields={fields} setFields={setFields} />

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Verification Progress
            </h3>
            <p className="mt-2 text-xs text-slate-600">
              {confirmedCount} of {fields.length} extracted fields confirmed.
            </p>
            {confirmedCount < fields.length && (
              <p className="mt-1 text-xs text-amber-700">
                Confirm all extracted values before running checks.
              </p>
            )}
          </div>
        </div>
      </div>

      <ResultsPanel checks={MOCK_EXTRACTION.mockChecks} />
    </div>
  );
}
