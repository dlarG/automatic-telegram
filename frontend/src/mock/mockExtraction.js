// Simulated backend response for UI development only.
// Replace with real API response in Phase 4.

export const MOCK_EXTRACTION = {
  projectId: "P007",
  sheetId: "S-10",
  columnId: "C1",
  storey: "2F-3F",
  gridX: "1",
  gridY: "A",
  extractedFields: [
    {
      id: "width",
      label: "Column Width",
      rawText: "300",
      value: 300,
      unit: "mm",
      confidence: 0.94,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
    {
      id: "depth",
      label: "Column Depth",
      rawText: "400",
      value: 400,
      unit: "mm",
      confidence: 0.93,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
    {
      id: "mainBarCount",
      label: "Longitudinal Bar Count",
      rawText: "12-20MM",
      value: 12,
      unit: "bars",
      confidence: 0.91,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
    {
      id: "mainBarDiameter",
      label: "Longitudinal Bar Diameter",
      rawText: "12-20MM",
      value: 20,
      unit: "mm",
      confidence: 0.91,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
    {
      id: "tieDiameter",
      label: "Tie / Hoop Diameter",
      rawText: "10@100",
      value: 10,
      unit: "mm",
      confidence: 0.88,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
    {
      id: "tieSpacing",
      label: "Tie / Hoop Spacing",
      rawText: "10@100",
      value: 100,
      unit: "mm",
      confidence: 0.88,
      sourceRegion: "schedule",
      userConfirmed: false,
    },
  ],
  mockChecks: [
    {
      id: "C1",
      label: "Minimum number of longitudinal bars for tied columns",
      nscpRef: "NSCP 410.7.3.1 (candidate — not yet validated)",
      status: "PRELIMINARILY_COMPLIANT",
      message:
        "Extracted bar count (12) meets the candidate minimum for the assumed tied column case. Awaiting engineer validation of the exact rule.",
      evidenceFieldIds: ["mainBarCount"],
    },
    {
      id: "C2",
      label: "Longitudinal reinforcement ratio within limits",
      nscpRef: "NSCP 410.6.1.1 (candidate — not yet validated)",
      status: "MANUAL_ENGINEER_REVIEW_REQUIRED",
      message:
        "Ratio calculation requires confirmed bar area and gross section area. Awaiting engineer-validated formula and limits.",
      evidenceFieldIds: ["width", "depth", "mainBarCount", "mainBarDiameter"],
    },
    {
      id: "C3",
      label: "Tie spacing limit for non-seismic columns",
      nscpRef: "NSCP 425.7.2.1 (candidate — not yet validated)",
      status: "MANUAL_ENGINEER_REVIEW_REQUIRED",
      message:
        "Limit depends on least column dimension, longitudinal bar diameter, and tie bar diameter. Awaiting engineer validation.",
      evidenceFieldIds: [
        "width",
        "depth",
        "mainBarDiameter",
        "tieDiameter",
        "tieSpacing",
      ],
    },
  ],
};

export const RESULT_STATUS_LABELS = {
  PRELIMINARILY_COMPLIANT: {
    label: "Preliminarily Compliant",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  PRELIMINARILY_NONCOMPLIANT: {
    label: "Preliminarily Noncompliant",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  PRESENT: {
    label: "Present",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  POSSIBLY_MISSING: {
    label: "Possibly Missing",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  UNREADABLE: {
    label: "Unreadable / Recapture",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  INSUFFICIENT_DOCUMENT_COVERAGE: {
    label: "Insufficient Document Coverage",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  NOT_APPLICABLE: {
    label: "Not Applicable",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  APPLICABILITY_UNCLEAR: {
    label: "Applicability Unclear",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  CONFLICTING_EVIDENCE: {
    label: "Conflicting Evidence",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  MANUAL_ENGINEER_REVIEW_REQUIRED: {
    label: "Manual Engineer Review Required",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
};
