import re
from typing import Optional


# ---------------------------------------------------------------------------
# Regex patterns tuned to formats found in the residence plan set (S-04).
# The parser is defensive: it returns None for any field it cannot extract,
# and never invents values.
# ---------------------------------------------------------------------------

# Column mark: C-1, C-2, C1, C2, C-24, etc.
RE_COLUMN_MARK = re.compile(r"\bC\s*-?\s*(\d{1,3})\b", re.IGNORECASE)

# Dimensions: "300 x 300", "0.30 x 0.30", "300x400"
RE_DIMENSIONS_MM = re.compile(r"\b(\d{2,4})\s*[xX×]\s*(\d{2,4})\b")
RE_DIMENSIONS_M = re.compile(r"\b(0\.\d{2})\s*[xX×]\s*(0\.\d{2})\b")

# Longitudinal bar callout: "8 - 16mmØ Vertical Bars", "4 - 16mmØ", "12-20MM"
RE_BARS_DASHED = re.compile(
    r"\b(\d{1,3})\s*[-–]\s*(\d{1,3})\s*(?:mm)?\s*(?:ø|Ø|phi|PHI|d)?\b",
    re.IGNORECASE,
)
RE_BARS_WITH_MM = re.compile(
    r"\b(\d{1,3})\s*[-–]\s*(\d{1,3})\s*(?:mm)\b", 
    re.IGNORECASE
)
RE_BARS_HASH = re.compile(r"\b(\d{1,3})\s*[-–]\s*#\s*(\d{1,3})\b")

# Tie / hoop callout: "12mm Ø Ties", "10mm ties @ 100mm", "10@100", "12mmØ Ties"
RE_TIE_DIAMETER = re.compile(
    r"(?:ø|Ø|∅|φ|phi)?\s*\b(\d{1,3})\s*(?:mm)?\b",
    re.IGNORECASE,
)
RE_TIE_SPACING_AT = re.compile(
    r"\b(\d{1,3})\s*(?:mm)?\s*@\s*(\d{2,4})\s*(?:mm)?\b",
    re.IGNORECASE,
)
RE_TIE_SPACING_TEXT = re.compile(
    r"(?:spacing\s*(?:at|of)?|@|at)\s*(\d{2,4})\s*(?:mm)?",
    re.IGNORECASE,
)

# Zone spacing list: "1Ø@50mm, 7@100mm" → joint zone + repeated
RE_ZONE_SPACING = re.compile(
    r"(\d{1,3})\s*(?:ø|Ø)\s*@\s*(\d{1,3})\s*(?:mm)?\s*[,\s]+\s*(\d{1,3})\s*@\s*(\d{1,3})\s*(?:mm)?",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text)


def _find_first(pattern: re.Pattern, text: str, group: int = 1) -> Optional[str]:
    match = pattern.search(text)
    if not match:
        return None
    return match.group(group)


# ---------------------------------------------------------------------------
# Field extractors
# ---------------------------------------------------------------------------

def extract_column_mark(text: str) -> Optional[str]:
    """
    Return a normalized column mark like 'C-1' or None.
    """
    match = RE_COLUMN_MARK.search(text)
    if not match:
        return None
    number = match.group(1)
    return f"C-{number}"


def extract_dimensions(text: str) -> dict:
    """
    Return {'width_mm': int, 'depth_mm': int} or {} if not found.
    Handles both mm and m formats, and multi-line dimension pairs like:
        0.30
        C-1
        0.30
    """
    text_clean = _normalize_whitespace(text)

    # ---- Primary: single-line "W x D" ----
    m = RE_DIMENSIONS_MM.search(text_clean)
    if m:
        w, d = int(m.group(1)), int(m.group(2))
        if 50 <= w <= 2000 and 50 <= d <= 2000:
            return {"width_mm": w, "depth_mm": d}

    m = RE_DIMENSIONS_M.search(text_clean)
    if m:
        w = int(round(float(m.group(1)) * 1000))
        d = int(round(float(m.group(2)) * 1000))
        return {"width_mm": w, "depth_mm": d}

    # ---- Fallback: two dimension-shaped tokens on separate lines ----
    # Search the raw text, not whitespace-collapsed, to preserve line breaks.
    # Matches "0.30", "0.20", "300", "200", "0.25" etc.
    dim_token = re.compile(r"^\s*(0\.\d{2}|\d{2,4})\s*$")

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    numeric_lines = []
    for i, ln in enumerate(lines):
        if dim_token.match(ln):
            numeric_lines.append((i, ln))

    # If we have at least two numeric dimension lines, use the first two.
    if len(numeric_lines) >= 2:
        def to_mm(token: str) -> int:
            if token.startswith("0."):
                return int(round(float(token) * 1000))
            return int(token)

        w = to_mm(numeric_lines[0][1])
        d = to_mm(numeric_lines[1][1])
        if 50 <= w <= 2000 and 50 <= d <= 2000:
            return {"width_mm": w, "depth_mm": d}

    return {}


def extract_longitudinal_bars(text: str) -> dict:
    text_clean = _normalize_whitespace(text)

    # 1. Narrow down to the MAIN BAR section if it exists
    main_bar_section = text_clean
    if "MAIN BAR" in text_clean.upper():
        main_bar_section = text_clean.upper().split("MAIN BAR")[1]

    # 2. Match "6-φ16mm", "6-Ø16mm", or "6 - 16mm"
    # Notice we added 'φ' to the symbol list (?:ø|Ø|∅|φ|phi)
    m = re.search(r"(\d{1,3})\s*[-–]\s*(?:ø|Ø|∅|φ|phi)?\s*(\d{1,3})\s*mm", main_bar_section, re.IGNORECASE)
    if m:
        count, diameter = int(m.group(1)), int(m.group(2))
        if 2 <= count <= 50 and 6 <= diameter <= 40:
            return {"bar_count": count, "bar_diameter_mm": diameter}

    # Fallback for "8 - 16mmØ Vertical Bars" (Residence format)
    m = re.search(r"(\d{1,3})\s*[-–]\s*(\d{1,3})\s*mm\s*(?:ø|Ø|∅|φ|phi)", main_bar_section, re.IGNORECASE)
    if m:
        count, diameter = int(m.group(1)), int(m.group(2))
        if 2 <= count <= 50 and 6 <= diameter <= 40:
            return {"bar_count": count, "bar_diameter_mm": diameter}

    return {}


def extract_tie_info(text: str) -> dict:
    text_clean = _normalize_whitespace(text)
    out = {}

    # 1. Narrow down to the TIES section if it exists
    tie_section = text_clean
    if "TIES" in text_clean.upper():
        tie_section = text_clean.upper().split("TIES")[1]
    elif "TIE" in text_clean.upper():
        tie_section = text_clean.upper().split("TIE")[1]

    # 2. Match "φ10 mm", "Ø10mm", "10mm"
    # Notice we added 'φ' here as well
    m = re.search(r"(?:ø|Ø|∅|φ|phi)?\s*(\d{1,3})\s*mm", tie_section, re.IGNORECASE)
    if m:
        diameter = int(m.group(1))
        if 6 <= diameter <= 25:
            out["tie_diameter_mm"] = diameter

    # 3. Spacing: "@100mm", "@ 75", "SPACED 100mm"
    m = re.search(r"@\s*(\d{2,4})", text_clean, re.IGNORECASE)
    if m:
        spacing = int(m.group(1))
        if 25 <= spacing <= 600:
            out["tie_spacing_mm"] = spacing

    if "tie_diameter_mm" in out and "tie_spacing_mm" not in out:
        out["tie_spacing_mm"] = None
        out["tie_spacing_note"] = "spacing not explicit; may require Column Detail"

    return out


def extract_zone_spacing(text: str) -> list:
    """
    Return list of {'count': int, 'spacing_mm': int} entries if the text
    contains a joint-zone callout like '1Ø@50mm, 7@100mm'.
    """
    text_clean = _normalize_whitespace(text)
    matches = RE_ZONE_SPACING.findall(text_clean)
    results = []
    for count1, spacing1, count2, spacing2 in matches:
        results.append({
            "zone": "joint",
            "count": int(count1),
            "spacing_mm": int(spacing1),
        })
        results.append({
            "zone": "joint",
            "count": int(count2),
            "spacing_mm": int(spacing2),
        })
    return results


# ---------------------------------------------------------------------------
# Top-level parse
# ---------------------------------------------------------------------------

def parse_fields(raw_text: str, source_view: str = "unknown") -> dict:
    """
    Parse structured fields from raw text.

    Parameters
    ----------
    raw_text : str
        Text from PDF extraction or OCR.
    source_view : str
        One of 'A' (locator), 'B' (schedule), 'C' (detail). Used for warnings.

    Returns
    -------
    dict with keys:
      - column_mark: str | None
      - width_mm, depth_mm: int | None
      - bar_count, bar_diameter_mm: int | None
      - tie_diameter_mm, tie_spacing_mm: int | None
      - zone_spacings: list
      - parse_confidence: float (0.0–1.0)
      - parse_warnings: list of str
      - source_view: str
    """
    if not raw_text or not raw_text.strip():
        return {
            "column_mark": None,
            "width_mm": None,
            "depth_mm": None,
            "bar_count": None,
            "bar_diameter_mm": None,
            "tie_diameter_mm": None,
            "tie_spacing_mm": None,
            "zone_spacings": [],
            "parse_confidence": 0.0,
            "parse_warnings": ["No text supplied to parser."],
            "source_view": source_view,
        }

    warnings = []
    result = {
        "column_mark": extract_column_mark(raw_text),
        "zone_spacings": extract_zone_spacing(raw_text),
        "source_view": source_view,
    }

    dims = extract_dimensions(raw_text)
    result["width_mm"] = dims.get("width_mm")
    result["depth_mm"] = dims.get("depth_mm")

    bars = extract_longitudinal_bars(raw_text)
    result["bar_count"] = bars.get("bar_count")
    result["bar_diameter_mm"] = bars.get("bar_diameter_mm")

    ties = extract_tie_info(raw_text)
    result["tie_diameter_mm"] = ties.get("tie_diameter_mm")
    result["tie_spacing_mm"] = ties.get("tie_spacing_mm")
    if ties.get("tie_spacing_note"):
        warnings.append(ties["tie_spacing_note"])

    # Count how many primary fields we got
    primary_fields = [
        result["column_mark"],
        result["width_mm"],
        result["depth_mm"],
        result["bar_count"],
        result["bar_diameter_mm"],
        result["tie_diameter_mm"],
    ]
    found = sum(1 for v in primary_fields if v is not None)
    result["parse_confidence"] = round(found / len(primary_fields), 2)

    if result["column_mark"] is None:
        warnings.append("Column mark not found.")
    if result["width_mm"] is None or result["depth_mm"] is None:
        warnings.append("Width/depth not found or ambiguous.")
    if result["bar_count"] is None or result["bar_diameter_mm"] is None:
        warnings.append("Longitudinal bar callout not parsed.")
    if result["tie_diameter_mm"] is None:
        warnings.append("Tie diameter not found.")

    result["parse_warnings"] = warnings
    return result