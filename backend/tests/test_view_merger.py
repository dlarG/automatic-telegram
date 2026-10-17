import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from app.services.view_merger import merge_view_results


# ---------------------------------------------------------------------------
# Fixtures — real values from the residence PDF
# ---------------------------------------------------------------------------

RESIDENCE_VIEW_A = {
    "extracted_fields": {
        "column_mark": "C-1",
        "width_mm": None,
        "depth_mm": None,
        "bar_count": None,
        "bar_diameter_mm": None,
        "tie_diameter_mm": None,
        "tie_spacing_mm": None,
        "zone_spacings": [],
        "parse_confidence": 0.17,
    }
}

RESIDENCE_VIEW_B = {
    "extracted_fields": {
        "column_mark": "C-1",
        "width_mm": 300,
        "depth_mm": 300,
        "bar_count": 8,
        "bar_diameter_mm": 16,
        "tie_diameter_mm": 12,
        "tie_spacing_mm": None,
        "zone_spacings": [],
        "parse_confidence": 1.0,
    }
}

RESIDENCE_VIEW_C = {
    "extracted_fields": {
        "column_mark": None,
        "width_mm": None,
        "depth_mm": None,
        "bar_count": None,
        "bar_diameter_mm": None,
        "tie_diameter_mm": 12,
        "tie_spacing_mm": 50,
        "zone_spacings": [
            {"zone": "joint", "count": 1, "spacing_mm": 50},
            {"zone": "joint", "count": 7, "spacing_mm": 100},
            {"zone": "midspan", "count": None, "spacing_mm": 150},
        ],
        "parse_confidence": 0.17,
    }
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_merge_all_three_views_residence():
    result = merge_view_results("P001-C1", {
        "A": RESIDENCE_VIEW_A,
        "B": RESIDENCE_VIEW_B,
        "C": RESIDENCE_VIEW_C,
    })

    assert result["column_mark"] == "C-1"
    assert result["width_mm"] == 300
    assert result["depth_mm"] == 300
    assert result["bar_count"] == 8
    assert result["bar_diameter_mm"] == 16
    assert result["tie_diameter_mm"] == 12  # B wins over C
    assert result["tie_spacing_mm"] == 50   # only C has it
    assert len(result["zone_spacings"]) == 3
    assert result["merge_confidence"] > 0.5
    assert len(result["conflicts"]) == 0


def test_provenance_records_sources():
    result = merge_view_results("P001-C1", {
        "A": RESIDENCE_VIEW_A,
        "B": RESIDENCE_VIEW_B,
        "C": RESIDENCE_VIEW_C,
    })

    p = result["field_provenance"]
    assert p["column_mark"] == "A"
    assert p["width_mm"] == "B"
    assert p["depth_mm"] == "B"
    assert p["bar_count"] == "B"
    assert p["bar_diameter_mm"] == "B"
    assert p["tie_diameter_mm"] == "B"
    assert p["tie_spacing_mm"] == "C"
    assert p["zone_spacings"] == "C"


def test_merge_with_missing_view_b():
    """If B is missing, C should be used as fallback for schedule fields."""
    result = merge_view_results("P001-C1", {
        "A": RESIDENCE_VIEW_A,
        "C": {
            "extracted_fields": {
                "tie_diameter_mm": 12,
                "tie_spacing_mm": 50,
                "zone_spacings": [],
            }
        },
    })

    assert result["column_mark"] == "C-1"
    assert result["width_mm"] is None
    assert result["tie_diameter_mm"] == 12
    assert result["tie_spacing_mm"] == 50
    # Warnings should mention missing fields
    assert any("width_mm" in w for w in result["merge_warnings"])


def test_conflict_between_views():
    """If A and B disagree on column mark, merge should report conflict."""
    view_a = {
        "extracted_fields": {"column_mark": "C-1"}
    }
    view_b = {
        "extracted_fields": {"column_mark": "C-2", "width_mm": 300, "depth_mm": 300}
    }

    result = merge_view_results("P001", {"A": view_a, "B": view_b})

    assert result["column_mark"] is None
    assert any(c["field"] == "column_mark" for c in result["conflicts"])


def test_no_views_at_all():
    result = merge_view_results("P001", {})
    assert result["column_mark"] is None
    assert result["width_mm"] is None
    assert result["merge_confidence"] == 0.0
    assert len(result["merge_warnings"]) >= 4


def test_zone_spacing_concatenation():
    """If both B and C supply zone_spacings, dedupe and merge."""
    view_b = {
        "extracted_fields": {
            "zone_spacings": [
                {"zone": "joint", "count": 1, "spacing_mm": 50},
            ]
        }
    }
    view_c = {
        "extracted_fields": {
            "zone_spacings": [
                {"zone": "joint", "count": 1, "spacing_mm": 50},
                {"zone": "midspan", "count": None, "spacing_mm": 150},
            ]
        }
    }
    result = merge_view_results("P001", {"B": view_b, "C": view_c})
    # C is preferred, so both entries should be preserved.
    assert len(result["zone_spacings"]) == 2