
# app/services/report_generator.py

from io import BytesIO
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)


# ---------------------------------------------------------
# REPORT COLORS
# ---------------------------------------------------------

NAVY = colors.HexColor("#17365D")
BLUE = colors.HexColor("#2563EB")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
LIGHT_GRAY = colors.HexColor("#F1F5F9")
DARK = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#64748B")

GREEN = colors.HexColor("#15803D")
LIGHT_GREEN = colors.HexColor("#DCFCE7")

RED = colors.HexColor("#B91C1C")
LIGHT_RED = colors.HexColor("#FEE2E2")

AMBER = colors.HexColor("#B45309")
LIGHT_AMBER = colors.HexColor("#FEF3C7")


# ---------------------------------------------------------
# RECOMMENDATION TEMPLATES
# ---------------------------------------------------------

def get_recommendation(rule):
    rule_id = rule.get("rule_id")
    details = rule.get("details") or {}

    if rule_id == "REBAR-RATIO-01":
        ratio = details.get("ratio_percent")
        minimum = details.get("min_allowed_percent", 1.0)
        maximum = details.get("max_allowed_percent", 6.0)

        if ratio is None:
            return (
                "The reinforcement ratio could not be calculated. "
                "Verify the column dimensions, longitudinal bar count, "
                "and bar diameter before performing this check."
            )

        if ratio < minimum:
            return (
                f"The calculated reinforcement ratio is {ratio:.2f}%, "
                f"which is below the minimum requirement of {minimum:.2f}%. "
                "Review the longitudinal reinforcement arrangement and "
                "consider an appropriate revision to achieve a ratio "
                f"within the {minimum:.0f}%–{maximum:.0f}% range. "
                "Evaluate any changes against the column dimensions, "
                "detailing requirements, and structural design conditions."
            )

        if ratio > maximum:
            return (
                f"The calculated reinforcement ratio is {ratio:.2f}%, "
                f"which exceeds the maximum requirement of {maximum:.2f}%. "
                "Review the reinforcement arrangement and consider an "
                "appropriate revision to bring the ratio within the "
                f"{minimum:.0f}%–{maximum:.0f}% range. Verify that the "
                "revised reinforcement remains structurally adequate "
                "and satisfies detailing requirements."
            )

    elif rule_id == "C2-MIN-BARS":
        actual = details.get("bar_count")
        required = details.get("min_required", 4)

        return (
            f"The identified longitudinal bar count is {actual}, "
            f"below the minimum of {required} bars used by this screening "
            "rule. Review the reinforcement layout and consider providing "
            "the required number of longitudinal bars. Verify the revised "
            "arrangement against the column design and applicable detailing "
            "provisions."
        )

    elif rule_id == "TIE-DIA-01":
        actual = details.get("tie_diameter_mm")
        required = details.get("min_required_mm")

        return (
            f"The identified tie diameter is {actual} mm, below the "
            f"minimum required diameter of {required} mm. Review the "
            "transverse reinforcement specification and consider an "
            "appropriate tie diameter that meets the applicable requirement. "
            "Verify the revised detailing with the structural design."
        )

    elif rule_id == "C3-TIE-SPACING":
        actual = details.get("max_spacing_found_mm")
        allowed = details.get("allowed_limit_mm")

        return (
            f"The maximum identified tie spacing is {actual} mm, "
            f"exceeding the calculated allowable limit of {allowed} mm. "
            "Review the tie arrangement and consider reducing the spacing "
            "to satisfy the applicable maximum spacing requirement. "
            "Check all tie zones and confinement regions in the drawing."
        )

    elif rule_id == "C7-CLEAR-SPACING":
        actual = details.get("estimated_clear_spacing_mm")
        required = details.get("required_min_mm")

        return (
            f"The estimated clear spacing is {actual} mm, below the "
            f"minimum screening value of {required} mm. Review the "
            "longitudinal bar arrangement, bar diameter, and column "
            "dimensions. Consider revising the reinforcement layout "
            "to provide adequate clear spacing. The actual arrangement "
            "must be checked against the structural drawing."
        )

    elif rule_id == "C8-LATERAL-SUPPORT":
        actual = details.get("average_spacing_mm")
        allowed = details.get("allowed_limit_mm", 150)

        return (
            f"The estimated average perimeter spacing is {actual} mm, "
            f"exceeding the {allowed} mm screening limit. Review the "
            "longitudinal bar arrangement and transverse reinforcement. "
            "Consider appropriate crossties or additional lateral support "
            "detailing to provide the required restraint to longitudinal "
            "bars. Verify the actual bar support configuration against "
            "the applicable detailing provisions."
        )

    return (
        "Review the identified finding, verify the extracted information, "
        "and consult the applicable design and detailing requirements "
        "before revising the structural drawing."
    )


# ---------------------------------------------------------
# STATUS FORMATTING
# ---------------------------------------------------------

def get_status_style(status):
    if status == "PRELIMINARILY_COMPLIANT":
        return "PRELIMINARILY COMPLIANT", GREEN, LIGHT_GREEN

    if status == "PRELIMINARILY_NONCOMPLIANT":
        return "PRELIMINARILY NONCOMPLIANT", RED, LIGHT_RED

    if status == "INSUFFICIENT_DOCUMENT_COVERAGE":
        return "INSUFFICIENT COVERAGE", AMBER, LIGHT_AMBER

    if status == "READABLE":
        return "READABLE", GREEN, LIGHT_GREEN

    if status == "UNREADABLE":
        return "UNREADABLE", RED, LIGHT_RED

    return status or "UNKNOWN", MUTED, LIGHT_GRAY


# ---------------------------------------------------------
# PDF GENERATOR
# ---------------------------------------------------------

def generate_screening_pdf(project: dict, merged: dict) -> BytesIO:

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="RC Column Screening Report",
        author="RC Screen",
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=5,
    ))

    styles.add(ParagraphStyle(
        name="Subtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=MUTED,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=16,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=7,
    ))

    styles.add(ParagraphStyle(
        name="BodySmall",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=12,
        textColor=DARK,
    ))

    styles.add(ParagraphStyle(
        name="MutedSmall",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
        textColor=MUTED,
    ))

    styles.add(ParagraphStyle(
        name="RuleTitle",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
        textColor=NAVY,
    ))

    styles.add(ParagraphStyle(
        name="Recommendation",
        parent=styles["BodyText"],
        fontSize=8.5,
        leading=12,
        textColor=DARK,
    ))

    story = []

    project = project or {}
    rules = merged.get("rule_results") or []

    # -----------------------------------------------------
    # HEADER
    # -----------------------------------------------------

    story.append(Paragraph(
        "RC COLUMN SCREENING REPORT",
        styles["ReportTitle"]
    ))

    story.append(Paragraph(
        "PRELIMINARY AUTOMATED SCREENING · NSCP 2015",
        styles["Subtitle"]
    ))

    story.append(Spacer(1, 5 * mm))

    story.append(HRFlowable(
        width="100%",
        thickness=1.5,
        color=BLUE
    ))

    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph(
        f"Report generated: {datetime.now().strftime('%B %d, %Y %I:%M %p')}",
        styles["MutedSmall"]
    ))

    # -----------------------------------------------------
    # PROJECT AND COLUMN INFORMATION
    # -----------------------------------------------------

    story.append(Paragraph(
        "1. PROJECT AND COLUMN INFORMATION",
        styles["SectionHeading"]
    ))

    def display(value):
        if value is None or value == "":
            return "Not identified"
        return str(value)

    project_title = display(project.get("title"))

    column_mark = display(merged.get("column_mark"))
    width = display(merged.get("width_mm"))
    depth = display(merged.get("depth_mm"))
    bar_count = display(merged.get("bar_count"))
    bar_diameter = display(merged.get("bar_diameter_mm"))
    tie_diameter = display(merged.get("tie_diameter_mm"))
    tie_spacing = display(merged.get("tie_spacing_mm"))

    project_data = [
        ["Project", project_title],
        ["Column Mark", column_mark],
        ["Dimensions", f"{width} x {depth} mm"],
        ["Main Reinforcement", f"{bar_count} bars - {bar_diameter} mm"],
        ["Transverse Reinforcement", f"{tie_diameter} mm ties"],
        ["General Tie Spacing", f"{tie_spacing} mm"],
    ]

    project_table = Table(
        project_data,
        colWidths=[48 * mm, 115 * mm]
    )

    project_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))

    story.append(project_table)

    # -----------------------------------------------------
    # SCREENING SUMMARY
    # -----------------------------------------------------

    engineering_rules = [
        r for r in rules
        if r.get("rule_id") != "OCR-READABILITY-01"
    ]

    
    # -----------------------------------------------------
    # ENGINEERING CHECKS
    # -----------------------------------------------------

    story.append(Paragraph(
        "2. ENGINEERING SCREENING RESULTS",
        styles["SectionHeading"]
    ))

    for index, rule in enumerate(engineering_rules, start=1):

        status_label, status_color, status_bg = get_status_style(
            rule.get("status")
        )

        label = escape(str(rule.get("label") or "Unnamed rule"))
        rule_id = escape(str(rule.get("rule_id") or "N/A"))
        message = escape(str(rule.get("message") or "No description supplied."))

        heading = Paragraph(
            f"<b>{index}. {label}</b><br/>"
            f"<font color='#64748B' size='7'>{rule_id}</font>",
            styles["RuleTitle"]
        )

        status = Paragraph(
            f"<b>{escape(status_label)}</b>",
            ParagraphStyle(
                name=f"Status{index}",
                parent=styles["BodySmall"],
                textColor=status_color,
                alignment=TA_CENTER,
            )
        )

        details = rule.get("details") or {}

        detail_lines = []

        for key, value in details.items():
            if value is not None:
                readable_key = key.replace("_", " ").title()
                detail_lines.append(
                    f"<b>{escape(readable_key)}:</b> "
                    f"{escape(str(value))}"
                )

        detail_text = "<br/>".join(detail_lines) if detail_lines else (
            "No calculation details available."
        )

        content = [
            heading,
            Spacer(1, 2 * mm),
            Paragraph(message, styles["BodySmall"]),
            Spacer(1, 2 * mm),
            Paragraph(
                f"<b>Calculation details</b><br/>{detail_text}",
                styles["BodySmall"]
            ),
        ]

        if rule.get("status") == "PRELIMINARILY_NONCOMPLIANT":
            recommendation = get_recommendation(rule)

            content.extend([
                Spacer(1, 2 * mm),
                Paragraph(
                    f"<b>Recommendation</b><br/>"
                    f"{escape(recommendation)}",
                    styles["Recommendation"]
                )
            ])

        card = Table(
            [[content, status]],
            colWidths=[130 * mm, 33 * mm]
        )

        card.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.white),
            ("BACKGROUND", (1, 0), (1, 0), status_bg),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))

        story.append(KeepTogether([
            card,
            Spacer(1, 3 * mm)
        ]))

    # -----------------------------------------------------
    # OCR READABILITY
    # -----------------------------------------------------

    readability = next(
        (r for r in rules if r.get("rule_id") == "OCR-READABILITY-01"),
        None
    )

    if readability:
        story.append(Paragraph(
            "3. DRAWING READABILITY",
            styles["SectionHeading"]
        ))

        status_label, status_color, status_bg = get_status_style(
            readability.get("status")
        )

        story.append(Paragraph(
            f"<b>{escape(status_label)}</b>",
            ParagraphStyle(
                name="OCRStatus",
                parent=styles["BodySmall"],
                textColor=status_color,
            )
        ))

        story.append(Paragraph(
            escape(str(readability.get("message") or "")),
            styles["BodySmall"]
        ))

        ocr_details = readability.get("details") or {}

        ocr_rows = [
            ["View A characters", str(ocr_details.get("view_a_characters", 0))],
            ["View B characters", str(ocr_details.get("view_b_characters", 0))],
            ["View C characters", str(ocr_details.get("view_c_characters", 0))],
            ["Total characters", str(ocr_details.get("total_characters", 0))],
            ["Minimum threshold", str(ocr_details.get("minimum_threshold", 10))],
        ]

        ocr_table = Table(ocr_rows, colWidths=[55 * mm, 35 * mm])

        ocr_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))

        story.append(Spacer(1, 2 * mm))
        story.append(ocr_table)


    
    # -----------------------------------------------------
    # ASSUMPTIONS AND DISCLAIMER
    # -----------------------------------------------------

    story.append(Paragraph(
        "4. ASSUMPTIONS AND LIMITATIONS",
        styles["SectionHeading"]
    ))

    assumptions = [
        "Clear-spacing estimation uses an assumed 40 mm concrete cover.",
        "Clear-spacing estimation uses an assumed 20 mm aggregate size.",
        "The clear-spacing calculation uses a simplified bar distribution model.",
        "Lateral-support spacing is an approximate perimeter-spacing calculation. "
        "It does not establish that every longitudinal bar is properly restrained.",
        "Drawing readability is based on the quantity of recognized OCR characters, "
        "not a guarantee of drawing completeness or OCR accuracy.",
    ]

    for assumption in assumptions:
        story.append(Paragraph(
            f"• {escape(assumption)}",
            styles["BodySmall"]
        ))

    story.append(Spacer(1, 3 * mm))

    disclaimer = (
        "This report presents preliminary automated screening results based "
        "on the structural information extracted from the supplied drawing "
        "views. It is not a structural design, safety certification, or "
        "professional engineering approval. Extracted values, calculations, "
        "assumptions, and recommendations must be independently reviewed and "
        "verified by a qualified structural engineer. Final design decisions "
        "must consider the complete structural system, applicable codes, "
        "loading conditions, and project-specific requirements."
    )

    disclaimer_table = Table(
        [[Paragraph(
            f"<b>IMPORTANT DISCLAIMER</b><br/><br/>{escape(disclaimer)}",
            styles["BodySmall"]
        )]],
        colWidths=[163 * mm]
    )

    disclaimer_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.8, MUTED),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))

    story.append(disclaimer_table)

    # -----------------------------------------------------
    # FOOTER AND PAGE NUMBERS
    # -----------------------------------------------------

    def draw_footer(canvas, document):
        canvas.saveState()

        page_width, _ = A4

        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.setLineWidth(0.5)
        canvas.line(
            18 * mm,
            14 * mm,
            page_width - 18 * mm,
            14 * mm
        )

        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)


        canvas.drawRightString(
            page_width - 18 * mm,
            9 * mm,
            f"Page {document.page}"
        )

        canvas.restoreState()

    doc.build(
        story,
        onFirstPage=draw_footer,
        onLaterPages=draw_footer
    )

    buffer.seek(0)

    return buffer
