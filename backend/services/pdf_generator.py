import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import os

def generate_portfolio_pdf(analysis_data: dict, funds_data: list) -> bytes:
    """Generate a professional PDF report for portfolio analysis."""

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center
        textColor=colors.HexColor('#1a365d')
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=colors.HexColor('#2d3748')
    )

    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14

    # Header with logo placeholder (you can add actual logo later)
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=12,
        alignment=1,
        textColor=colors.HexColor('#4a5568')
    )

    # Add BharatAlpha branding
    story.append(Paragraph("🇮🇳 BharatAlpha", header_style))
    story.append(Paragraph("Portfolio Intelligence Platform", header_style))
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", header_style))
    story.append(Spacer(1, 0.5*inch))

    # Title
    story.append(Paragraph("Portfolio Analysis Report", title_style))
    story.append(Spacer(1, 0.3*inch))

    # Executive Summary
    analysis = analysis_data.get('analysis', {})
    story.append(Paragraph("Executive Summary", subtitle_style))

    health_colors = {
        'GOOD': colors.green,
        'FAIR': colors.orange,
        'NEEDS_ATTENTION': colors.red
    }

    health_color = health_colors.get(analysis.get('overall_health', 'FAIR'), colors.orange)

    summary_table_data = [
        ['Portfolio Health', analysis.get('overall_health', 'FAIR')],
        ['Estimated XIRR Range', analysis.get('estimated_xirr_range', 'N/A')],
        ['Expense Drag', analysis.get('expense_drag', 'N/A')],
    ]

    summary_table = Table(summary_table_data, colWidths=[2*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f7fafc')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (1, 0), (1, 0), health_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
    ]))

    story.append(summary_table)
    story.append(Spacer(1, 0.3*inch))

    # Summary paragraph
    story.append(Paragraph(analysis.get('summary', 'Analysis summary not available.'), normal_style))
    story.append(Spacer(1, 0.3*inch))

    # Top Recommendation
    story.append(Paragraph("Top Recommendation", subtitle_style))
    story.append(Paragraph(analysis.get('top_recommendation', 'No specific recommendation available.'), normal_style))
    story.append(Spacer(1, 0.3*inch))

    # Funds Analysis
    story.append(Paragraph("Funds Analysis", subtitle_style))

    funds_table_data = [['Fund Name', 'Latest NAV', 'NAV Date', 'Status']]
    funds_analyzed = analysis_data.get('funds_analyzed', [])

    for fund in funds_analyzed:
        status = 'Keep'
        if fund.get('name') in analysis.get('funds_to_consider_replacing', []):
            status = 'Review'

        funds_table_data.append([
            fund.get('name', 'N/A'),
            f"₹{fund.get('nav', 'N/A')}" if fund.get('nav') else 'N/A',
            fund.get('date', 'N/A'),
            status
        ])

    funds_table = Table(funds_table_data, colWidths=[2.5*inch, 1.2*inch, 1.2*inch, 1.2*inch])
    funds_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f7fafc')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#2d3748')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))

    story.append(funds_table)
    story.append(Spacer(1, 0.3*inch))

    # Overlap Analysis
    story.append(Paragraph("Overlap Analysis", subtitle_style))
    story.append(Paragraph(analysis.get('overlap_analysis', 'Overlap analysis not available.'), normal_style))
    story.append(Spacer(1, 0.3*inch))

    # Suggested Alternatives
    if analysis.get('suggested_alternatives'):
        story.append(Paragraph("Suggested Alternatives", subtitle_style))
        for alt in analysis['suggested_alternatives']:
            story.append(Paragraph(f"• {alt}", normal_style))
        story.append(Spacer(1, 0.3*inch))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=1,
        textColor=colors.HexColor('#a0aec0')
    )

    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("This report is generated by BharatAlpha AI analysis. For personalized advice, consult a certified financial advisor.", footer_style))
    story.append(Paragraph("© 2024 BharatAlpha. All rights reserved.", footer_style))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()