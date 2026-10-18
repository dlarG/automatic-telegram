from app.services.rule_engine import check_rebar_ratio

def test_rebar_ratio_compliant():
    # C-1 from the residence: 300x300, 8x16mm
    # Gross = 90,000. Steel = 8 * 201.06 = 1608.5. Ratio = 1.78%
    fields = {
        "width_mm": 300,
        "depth_mm": 300,
        "bar_count": 8,
        "bar_diameter_mm": 16
    }
    result = check_rebar_ratio(fields)
    assert result["status"] == "PRELIMINARILY_COMPLIANT"
    assert result["details"]["ratio_percent"] == 1.79

def test_rebar_ratio_too_low():
    # 300x300, 4x12mm -> area is 452. Ratio is 0.5% (Too low)
    fields = {
        "width_mm": 300,
        "depth_mm": 300,
        "bar_count": 4,
        "bar_diameter_mm": 12
    }
    result = check_rebar_ratio(fields)
    assert result["status"] == "PRELIMINARILY_NONCOMPLIANT"
    assert "BELOW" in result["message"]

def test_rebar_ratio_too_high():
    # 300x300, 20x25mm -> area is 9817. Ratio is 10.9% (Too high)
    fields = {
        "width_mm": 300,
        "depth_mm": 300,
        "bar_count": 20,
        "bar_diameter_mm": 25
    }
    result = check_rebar_ratio(fields)
    assert result["status"] == "PRELIMINARILY_NONCOMPLIANT"
    assert "ABOVE" in result["message"]

def test_rebar_ratio_missing_data():
    fields = {"width_mm": 300, "depth_mm": 300} # Missing bars
    result = check_rebar_ratio(fields)
    assert result["status"] == "INSUFFICIENT_DOCUMENT_COVERAGE"