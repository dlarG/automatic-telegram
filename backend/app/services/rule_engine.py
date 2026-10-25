import math

def check_rebar_ratio(merged_fields: dict) -> dict:
    """
    Check if the longitudinal reinforcement ratio is within 1% to 6% of the gross area.
    Based on collaborator confirmation (Sir Macuto).
    """
    rule_id = "REBAR-RATIO-01"
    label = "Longitudinal Reinforcement Ratio (1% - 6%)"
    
    width = merged_fields.get("width_mm")
    depth = merged_fields.get("depth_mm")
    bar_count = merged_fields.get("bar_count")
    bar_dia = merged_fields.get("bar_diameter_mm")

    # 1. Verify we have all inputs
    missing = []
    if width is None: missing.append("width_mm")
    if depth is None: missing.append("depth_mm")
    if bar_count is None: missing.append("bar_count")
    if bar_dia is None: missing.append("bar_diameter_mm")

    if missing:
        return {
            "rule_id": rule_id,
            "label": label,
            "status": "INSUFFICIENT_DOCUMENT_COVERAGE",
            "message": f"Missing inputs for calculation: {', '.join(missing)}",
            "details": {}
        }

    # 2. Calculate
    gross_area = width * depth
    bar_area = math.pi * ((bar_dia / 2) ** 2)
    steel_area = bar_count * bar_area
    ratio = steel_area / gross_area

    # 3. Evaluate against 1% - 6% (0.01 - 0.06)
    min_ratio = 0.01
    max_ratio = 0.06
    
    status = "PRELIMINARILY_COMPLIANT"
    message = "The reinforcement ratio is within the 1% - 6% limit."
    
    if ratio < min_ratio:
        status = "PRELIMINARILY_NONCOMPLIANT"
        message = f"Reinforcement ratio ({ratio*100:.2f}%) is BELOW the 1% minimum."
    elif ratio > max_ratio:
        status = "PRELIMINARILY_NONCOMPLIANT"
        message = f"Reinforcement ratio ({ratio*100:.2f}%) is ABOVE the 6% maximum."

    return {
        "rule_id": rule_id,
        "label": label,
        "status": status,
        "message": message,
        "details": {
            "gross_area_mm2": round(gross_area, 2),
            "steel_area_mm2": round(steel_area, 2),
            "ratio_percent": round(ratio * 100, 2),
            "min_allowed_percent": 1.0,
            "max_allowed_percent": 6.0
        }
    }

def check_tie_diameter(merged_fields: dict) -> dict:
    """
    Check if tie diameter meets the NSCP minimum (10mm).
    NSCP 2015 Section 425.7.2.2
    """
    rule_id = "TIE-DIA-01"
    label = "Minimum Tie Bar Diameter (NSCP 425.7.2.2)"
    
    tie_dia = merged_fields.get("tie_diameter_mm")
    main_bar_dia = merged_fields.get("bar_diameter_mm")

    if tie_dia is None or main_bar_dia is None:
        return {
            "rule_id": rule_id,
            "label": label,
            "status": "INSUFFICIENT_DOCUMENT_COVERAGE",
            "message": "Missing tie or main bar diameter to evaluate.",
            "details": {}
        }

    # NSCP 425.7.2.2: Minimum tie diameter is 10mm for bars 32mm or smaller
    min_required = 10 if main_bar_dia <= 32 else 12

    if tie_dia >= min_required:
        status = "PRELIMINARILY_COMPLIANT"
        message = f"Tie diameter ({tie_dia}mm) meets the minimum {min_required}mm requirement."
    else:
        status = "PRELIMINARILY_NONCOMPLIANT"
        message = f"Tie diameter ({tie_dia}mm) is BELOW the {min_required}mm minimum."

    return {
        "rule_id": rule_id,
        "label": label,
        "status": status,
        "message": message,
        "details": {
            "tie_diameter_mm": tie_dia,
            "main_bar_diameter_mm": main_bar_dia,
            "min_required_mm": min_required
        }
    }

def check_min_longitudinal_bars(merged_fields: dict) -> dict:
    """
    Check if the number of longitudinal bars meets the NSCP minimum of 4.
    NSCP 2015 Section 410.7.3.1 (b): Four bars within rectangular or circular ties.
    """
    rule_id = "C2-MIN-BARS"
    label = "Minimum Number of Longitudinal Bars (NSCP 410.7.3.1)"
    
    bar_count = merged_fields.get("bar_count")

    # 1. Verify we have the input
    if bar_count is None:
        return {
            "rule_id": rule_id,
            "label": label,
            "status": "INSUFFICIENT_DOCUMENT_COVERAGE",
            "message": "Missing bar count to evaluate minimum requirement.",
            "details": {}
        }

    # 2. The NSCP rule for tied columns
    min_required = 4

    # 3. Evaluate
    if bar_count >= min_required:
        status = "PRELIMINARILY_COMPLIANT"
        message = f"Bar count ({bar_count}) meets the NSCP minimum of {min_required} bars for tied columns."
    else:
        status = "PRELIMINARILY_NONCOMPLIANT"
        message = f"Bar count ({bar_count}) is BELOW the NSCP minimum of {min_required} bars for tied columns."

    return {
        "rule_id": rule_id,
        "label": label,
        "status": status,
        "message": message,
        "details": {
            "bar_count": bar_count,
            "min_required": min_required
        }
    }


def run_all_rules(merged_fields: dict) -> list:
    """Run all validated rules and return a list of results."""
    results = []
    
    # Rule 1: Rebar Ratio
    results.append(check_rebar_ratio(merged_fields))

    # Rule 2: Minimum Longitudinal Bars
    results.append(check_min_longitudinal_bars(merged_fields))

    # Rule 3: Tie Diameter
    results.append(check_tie_diameter(merged_fields))
    # Future rules will be added here once validated by collaborators
    
    return results