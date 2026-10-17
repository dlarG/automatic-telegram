import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from app.services.field_parser import (
    extract_column_mark,
    extract_dimensions,
    extract_longitudinal_bars,
    extract_tie_info,
    extract_zone_spacing,
    parse_fields,
)


# ---------------------------------------------------------------------------
# Real strings from the residence plan S-04
# ---------------------------------------------------------------------------

C1_SCHEDULE_TEXT = (
    "C-1\n"
    "8 - 16mm\u00d8 Vertical Bars\n"
    "12mm \u00d8 Ties\n"
    "(for Tie spacing, see Column Detail)\n"
    "0.30 x 0.30"
)

C2_SCHEDULE_TEXT = (
    "C-2\n"
    "4 - 16mm\u00d8 Vertical Bars\n"
    "12mm \u00d8 Ties Spacing at 100mm\n"
    "0.20 x 0.20"
)

COLUMN_DETAIL_TEXT = (
    "12mm\u00d8 Ties\n"
    "1\u00d8@50mm, 7@100mm\n"
    "12mm\u00d8 Ties\n"
    "Midspan Ties\n"
    "12mm\u00d8 at 150mm"
)


# ---------------------------------------------------------------------------
# Column mark
# ---------------------------------------------------------------------------

def test_extract_column_mark_c1():
    assert extract_column_mark("C-1 schedule") == "C-1"


def test_extract_column_mark_c2():
    assert extract_column_mark("C-2 schedule") == "C-2"


def test_extract_column_mark_c24():
    assert extract_column_mark("C24") == "C-24"


def test_extract_column_mark_missing():
    assert extract_column_mark("Schedule of Columns") is None


# ---------------------------------------------------------------------------
# Dimensions
# ---------------------------------------------------------------------------

def test_extract_dimensions_mm():
    assert extract_dimensions("300 x 300") == {"width_mm": 300, "depth_mm": 300}


def test_extract_dimensions_m():
    assert extract_dimensions("0.30 x 0.30") == {"width_mm": 300, "depth_mm": 300}


def test_extract_dimensions_none():
    assert extract_dimensions("No dimensions here") == {}


def test_extract_dimensions_rejects_nonsense():
    assert extract_dimensions("2026 x 05") == {}


# ---------------------------------------------------------------------------
# Longitudinal bars
# ---------------------------------------------------------------------------

def test_extract_bars_c1():
    assert extract_longitudinal_bars(C1_SCHEDULE_TEXT) == {
        "bar_count": 8,
        "bar_diameter_mm": 16,
    }


def test_extract_bars_c2():
    assert extract_longitudinal_bars(C2_SCHEDULE_TEXT) == {
        "bar_count": 4,
        "bar_diameter_mm": 16,
    }


def test_extract_bars_dashed_mm_format():
    # From the handoff example
    assert extract_longitudinal_bars("12-20MM VERTICAL BARS") == {
        "bar_count": 12,
        "bar_diameter_mm": 20,
    }


def test_extract_bars_none():
    assert extract_longitudinal_bars("12mm Ties") == {}


# ---------------------------------------------------------------------------
# Tie / hoop
# ---------------------------------------------------------------------------

def test_extract_tie_c1_diameter_only():
    # C-1 says "see Column Detail" for spacing
    out = extract_tie_info(C1_SCHEDULE_TEXT)
    assert out["tie_diameter_mm"] == 12
    assert out["tie_spacing_mm"] is None
    assert "spacing not explicit" in out["tie_spacing_note"]


def test_extract_tie_c2_diameter_and_spacing():
    out = extract_tie_info(C2_SCHEDULE_TEXT)
    assert out["tie_diameter_mm"] == 12
    assert out["tie_spacing_mm"] == 100


def test_extract_tie_at_format():
    out = extract_tie_info("10mm ties @ 100mm")
    assert out["tie_diameter_mm"] == 10
    assert out["tie_spacing_mm"] == 100


# ---------------------------------------------------------------------------
# Zone spacing
# ---------------------------------------------------------------------------

def test_extract_zone_spacing_joint_callout():
    zones = extract_zone_spacing(COLUMN_DETAIL_TEXT)
    # Expect two entries: 1@50 and 7@100
    assert len(zones) >= 2
    spacings = [z["spacing_mm"] for z in zones]
    assert 50 in spacings
    assert 100 in spacings


def test_extract_zone_spacing_none():
    assert extract_zone_spacing("No zone callout here") == []


# ---------------------------------------------------------------------------
# Full parse
# ---------------------------------------------------------------------------

def test_parse_fields_c1_schedule():
    result = parse_fields(C1_SCHEDULE_TEXT, source_view="B")
    assert result["column_mark"] == "C-1"
    assert result["width_mm"] == 300
    assert result["depth_mm"] == 300
    assert result["bar_count"] == 8
    assert result["bar_diameter_mm"] == 16
    assert result["tie_diameter_mm"] == 12
    assert result["tie_spacing_mm"] is None
    assert result["parse_confidence"] > 0.5
    assert any("spacing not explicit" in w for w in result["parse_warnings"])


def test_parse_fields_c2_schedule():
    result = parse_fields(C2_SCHEDULE_TEXT, source_view="B")
    assert result["column_mark"] == "C-2"
    assert result["width_mm"] == 200
    assert result["depth_mm"] == 200
    assert result["bar_count"] == 4
    assert result["bar_diameter_mm"] == 16
    assert result["tie_diameter_mm"] == 12
    assert result["tie_spacing_mm"] == 100


def test_parse_fields_column_detail():
    result = parse_fields(COLUMN_DETAIL_TEXT, source_view="C")
    assert result["tie_diameter_mm"] == 12
    assert len(result["zone_spacings"]) >= 2


def test_parse_fields_empty():
    result = parse_fields("", source_view="B")
    assert result["parse_confidence"] == 0.0
    assert "No text supplied" in result["parse_warnings"][0]


def test_parse_fields_column_mark_only():
    result = parse_fields("C-1", source_view="A")
    assert result["column_mark"] == "C-1"
    assert result["parse_confidence"] > 0.0
    assert any("Width/depth not found" in w for w in result["parse_warnings"])