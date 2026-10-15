"""
PDF Report Generator for AI Vehicle Damage Inspection & Cost Quotation.
Handles both damaged vehicles and pristine / undamaged vehicles.
"""

import os
import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)

def build_pdf_report(
    inspection_data: Dict[str, Any],
    original_image_bytes: Optional[bytes] = None,
    annotated_image_bytes: Optional[bytes] = None
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    header_title = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#065F46")
    )
    header_sub = ParagraphStyle(
        "HeaderSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4B5563")
    )
    section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=6
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#111827")
    )
    body_normal = ParagraphStyle(
        "BodyNormal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#374151")
    )
    alert_box_text = ParagraphStyle(
        "AlertBoxText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#065F46"),
        alignment=1
    )

    elements = []

    survey_id = inspection_data.get("survey_id", f"PK-SURV-{datetime.now().strftime('%Y%m%d%H%M')}")
    current_date = datetime.now().strftime("%d-%b-%Y %I:%M %p")

    header_table_data = [
        [
            Paragraph("<b>AutoDamage AI Pakistan</b><br/><font size=8 color='#047857'>AI Vehicle Inspection & Repair Cost System</font>", header_title),
            Paragraph(f"<b>SURVEY REPORT</b><br/>Ref: <b>{survey_id}</b><br/>Date: {current_date}", header_sub)
        ]
    ]
    header_table = Table(header_table_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#047857"), spaceAfter=12))

    vehicle = inspection_data.get("vehicle", {})
    city = inspection_data.get("city", "Lahore")
    total_damages = inspection_data.get("total_damages", 0)
    overall_severity = inspection_data.get("overall_severity", "None")

    severity_color = colors.HexColor("#059669") if overall_severity in ("None", "Minor") else (colors.HexColor("#DC2626") if overall_severity == "High" else colors.HexColor("#D97706"))
    status_label = "PRISTINE (NO DAMAGE)" if total_damages == 0 else f"{overall_severity.upper()} DAMAGE"

    meta_data = [
        [
            Paragraph("<b>Vehicle Make & Model:</b>", body_bold),
            Paragraph(f"{vehicle.get('make', 'Toyota')} {vehicle.get('model', 'Corolla')} ({vehicle.get('generation', '')})", body_normal),
            Paragraph("<b>Inspection Location:</b>", body_bold),
            Paragraph(f"{city}, Pakistan", body_normal)
        ],
        [
            Paragraph("<b>Inspection Status:</b>", body_bold),
            Paragraph(f"<b><font color='{severity_color}'>{status_label}</font></b>", body_normal),
            Paragraph("<b>Damaged Panels Found:</b>", body_bold),
            Paragraph(f"<b>{total_damages} Parts</b>", body_normal)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[135, 140, 135, 130])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F3F4F6")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    if not annotated_image_bytes and inspection_data.get("annotated_image_base64"):
        try:
            b64_str = inspection_data["annotated_image_base64"].split(",")[-1]
            annotated_image_bytes = base64.b64decode(b64_str)
        except Exception:
            pass

    if annotated_image_bytes:
        try:
            img_io = io.BytesIO(annotated_image_bytes)
            rep_img = Image(img_io, width=280, height=190)
            elements.append(Paragraph("AI Inspection & Damage Localization Visualizer", section_title))
            img_table = Table([[rep_img]], colWidths=[540])
            img_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(img_table)
            elements.append(Spacer(1, 10))
        except Exception:
            pass

    detections = inspection_data.get("detections", [])

    if total_damages == 0:
        # NO DAMAGE PRESENTATION
        elements.append(Paragraph("Inspection Assessment Result", section_title))
        no_dmg_data = [
            [
                Paragraph("<b>PASSED: VEHICLE IN PRISTINE CONDITION</b><br/><font size=9 color='#065F46'>No scratches, dents, or structural collision damages were detected. All exterior panels are intact.</font>", alert_box_text)
            ]
        ]
        no_dmg_table = Table(no_dmg_data, colWidths=[540])
        no_dmg_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#059669")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(no_dmg_table)
        elements.append(Spacer(1, 12))
    else:
        # DAMAGED PARTS TABLE
        elements.append(Paragraph("Detected Damaged Parts & Severity Assessment", section_title))
        parts_table_data = [
            [
                Paragraph("<b>#</b>", body_bold),
                Paragraph("<b>Damaged Part</b>", body_bold),
                Paragraph("<b>Severity</b>", body_bold),
                Paragraph("<b>Confidence</b>", body_bold),
                Paragraph("<b>Recommended Action</b>", body_bold)
            ]
        ]

        for idx, d in enumerate(detections, start=1):
            sev = d.get("severity", "Moderate")
            sev_color = "#DC2626" if sev == "High" else ("#D97706" if sev == "Moderate" else "#059669")
            parts_table_data.append([
                Paragraph(str(idx), body_normal),
                Paragraph(f"<b>{d.get('part', 'Component')}</b>", body_normal),
                Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", body_normal),
                Paragraph(f"{d.get('confidence', 80)}%", body_normal),
                Paragraph(d.get("severity_info", {}).get("action", "Repair & Paint"), body_normal)
            ])

        parts_table = Table(parts_table_data, colWidths=[25, 140, 75, 70, 230])
        parts_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#065F46")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(parts_table)
        elements.append(Spacer(1, 10))

    # Internal & Structural Damages (if any)
    internal_damages = inspection_data.get("internal_damages", [])
    if internal_damages:
        elements.append(Paragraph("Internal & Structural Collision Assessment", section_title))
        int_table_data = [
            [
                Paragraph("<b>Component / System</b>", body_bold),
                Paragraph("<b>Identified Potential Issue</b>", body_bold),
                Paragraph("<b>Safety / Urgency</b>", body_bold),
                Paragraph("<b>Est. Labor</b>", body_bold)
            ]
        ]
        for itm in internal_damages:
            int_table_data.append([
                Paragraph(f"<b>{itm.get('part', 'Internal Component')}</b><br/><font size=7 color='#6B7280'>{itm.get('system', '')}</font>", body_normal),
                Paragraph(itm.get("damage_nature", "Impact Damage"), body_normal),
                Paragraph(f"<font color='#B45309'><b>{itm.get('urgency', 'Attention Recommended')}</b></font>", body_normal),
                Paragraph(f"{itm.get('est_labor_hours', 2.0)} hrs", body_normal)
            ])
        int_table = Table(int_table_data, colWidths=[150, 190, 140, 60])
        int_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F2937")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(int_table)
        elements.append(Spacer(1, 10))

    # Repair Cost Summary
    consensus = inspection_data.get("consensus_estimate", {})
    cost_range = consensus.get("cost_range_display", "PKR 0" if total_damages == 0 else "PKR 35,000 – 55,000")
    recommended_pkr = consensus.get("recommended_cost_pkr", 0)

    elements.append(Paragraph("Repair Cost Quotation (Pakistani Market Standards)", section_title))
    
    banner_data = [
        [
            Paragraph(f"<b>ESTIMATED REPAIR QUOTATION:</b> {cost_range}<br/><font size=9 color='#374151'>Recommended Benchmark: <b>PKR {recommended_pkr:,}</b></font>", alert_box_text)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#059669")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 12))

    disclaimer = Paragraph(
        "<i>Disclaimer: This quotation is generated by the AI-Based Vehicle Damage Detection and Cost Estimation System "
        "using YOLOv11 and Google Gemini Multi-Agent Layer calibrated for Pakistan.</i>",
        body_normal
    )
    elements.append(disclaimer)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
