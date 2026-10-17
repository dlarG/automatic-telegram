from typing import Optional


# ---------------------------------------------------------------------------
# Merge rules
# ---------------------------------------------------------------------------
# Priority per field:
#   column_mark          -> A (locator) then B (schedule)
#   width_mm             -> B then C
#   depth_mm             -> B then C
#   bar_count            -> B then C
#   bar_diameter_mm      -> B then C
#   tie_diameter_mm      -> B then C
#   tie_spacing_mm       -> B then C
#   zone_spacings        -> C then B
#
# If two views supply the same field and they disagree, we record a conflict
# and set the merged value to None. This matches the reduced MVP scope:
# conflicting evidence is surfaced, never silently resolved.
# ---------------------------------------------------------------------------

FIELD_PRIORITY = {
    "column_mark":       ["A", "B"],
    "width_mm":          ["B", "C"],
    "depth_mm":          ["B", "C"],
    "bar_count":         ["B", "C"],
    "bar_diameter_mm":   ["B", "C"],
    "tie_diameter_mm":   ["B", "C"],
    "tie_spacing_mm":    ["B", "C"],
    "zone_spacings":     ["C", "B"],
}

# Fields whose disagreement is meaningful enough to block a merged value.
# Fields not listed here (like zone_spacings) are merged by concatenation.
CONFLICT_SENSITIVE_FIELDS = {
    "column_mark",
    "width_mm",
    "depth_mm",
    "bar_count",
    "bar_diameter_mm",
    "tie_diameter_mm",
    "tie_spacing_mm",
}


def _get(view_result: Optional[dict], field: str):
    if not view_result:
        return None
    fields = view_result.get("extracted_fields") or {}
    value = fields.get(field)
    # Treat empty list as None for scalar fields
    if value == [] and field != "zone_spacings":
        return None
    return value


def _collect_candidates(views: dict, field: str) -> list:
    """
    Return list of (view_key, value) for every view that supplied a non-None
    value for this field, in priority order.
    """
    candidates = []
    for key in FIELD_PRIORITY.get(field, []):
        value = _get(views.get(key), field)
        if value is None:
            continue
        candidates.append((key, value))
    return candidates


def _merge_scalar(candidates: list, field: str):
    """
    Returns (merged_value, source_view, conflict_bool).
    If two candidates disagree and the field is conflict-sensitive, returns
    (None, None, True) and lets the caller record the conflict.
    """
    if not candidates:
        return None, None, False

    # First candidate is the priority source
    primary_view, primary_value = candidates[0]

    if field in CONFLICT_SENSITIVE_FIELDS:
        for other_view, other_value in candidates[1:]:
            if other_value != primary_value:
                return None, None, True

    return primary_value, primary_view, False


def merge_view_results(case_id: str, views: dict) -> dict:
    """
    Merge extraction results from Views A, B, and C into one confirmed field
    set. Views is a dict like {"A": {...}, "B": {...}, "C": {...}} where
    each value is the "extracted_fields" dict from a prior /api/extract call.

    Returns a merged result dict with provenance, conflicts, and warnings.
    """
    merged = {}
    provenance = {}
    conflicts = []
    warnings = []

    # --- Scalar fields ---
    for field in FIELD_PRIORITY:
        if field == "zone_spacings":
            continue

        candidates = _collect_candidates(views, field)
        value, source, conflict = _merge_scalar(candidates, field)

        if conflict:
            values_by_view = {k: v for k, v in candidates}
            conflicts.append({
                "field": field,
                "values_by_view": values_by_view,
                "message": (
                    f"Views disagree on {field}: "
                    + ", ".join(f"{k}={v}" for k, v in values_by_view.items())
                ),
            })
            merged[field] = None
            provenance[field] = None
        else:
            merged[field] = value
            provenance[field] = source

    # --- Zone spacings: merge by concatenation across views, dedup ---
    zone_spacings = []
    zone_source = None
    for key in FIELD_PRIORITY["zone_spacings"]:
        zones = _get(views.get(key), "zone_spacings") or []
        for z in zones:
            if z not in zone_spacings:
                zone_spacings.append(z)
                if zone_source is None:
                    zone_source = key

    merged["zone_spacings"] = zone_spacings
    provenance["zone_spacings"] = zone_source

    # --- Warnings ---
    for field in FIELD_PRIORITY:
        if field == "zone_spacings":
            continue
        if merged.get(field) is None and not any(
            c["field"] == field for c in conflicts
        ):
            warnings.append(f"{field} not supplied by any view.")

    if merged.get("tie_spacing_mm") is None and zone_spacings:
        warnings.append(
            "tie_spacing_mm not explicit; see zone_spacings for zone-level values."
        )

    if merged.get("column_mark") is None:
        warnings.append(
            "column_mark could not be established from the supplied views."
        )

    # --- Confidence ---
    # Weighted by importance: schedule fields matter most.
    WEIGHTS = {
        "column_mark": 2.0,
        "width_mm": 1.0,
        "depth_mm": 1.0,
        "bar_count": 1.0,
        "bar_diameter_mm": 1.0,
        "tie_diameter_mm": 0.5,
        "tie_spacing_mm": 0.5,
    }
    total_weight = sum(WEIGHTS.values())
    achieved = 0.0
    for field, weight in WEIGHTS.items():
        if merged.get(field) is not None:
            achieved += weight
        elif any(c["field"] == field for c in conflicts):
            # Conflicts do not count as achieved but are surfaced separately
            pass

    merge_confidence = round(achieved / total_weight, 2) if total_weight else 0.0

    return {
        "case_id": case_id,
        "column_mark": merged.get("column_mark"),
        "width_mm": merged.get("width_mm"),
        "depth_mm": merged.get("depth_mm"),
        "bar_count": merged.get("bar_count"),
        "bar_diameter_mm": merged.get("bar_diameter_mm"),
        "tie_diameter_mm": merged.get("tie_diameter_mm"),
        "tie_spacing_mm": merged.get("tie_spacing_mm"),
        "zone_spacings": zone_spacings,
        "field_provenance": provenance,
        "conflicts": conflicts,
        "merge_confidence": merge_confidence,
        "merge_warnings": warnings,
    }