import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

OLLAMA_URL = getattr(settings, "OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = getattr(settings, "OLLAMA_MODEL", "gemma3:4b")


async def generate_proposal_text(
    project_name: str,
    client_name: str,
    project_type: str,
    address: str | None,
    style_preferences: list[str],
    rooms_summary: list[dict],
    quotation_summary: dict | None,
    special_requirements: str | None = None,
    style_notes: str | None = None,
) -> dict:
    """
    Generate proposal prose using local Ollama model (gemma3:4b).
    AI generates TEXT ONLY — never numbers. Numbers come from the quotation engine.
    """

    rooms_text = "\n".join(
        f"- {r['name']} ({r['type']}): {r['area_sqft']} sqft, work: {', '.join(r.get('work_types', []))}"
        for r in rooms_summary
    )

    quotation_text = ""
    if quotation_summary:
        quotation_text = f"""
Quotation Summary:
- Subtotal: Rs.{quotation_summary.get('subtotal', 0):,.0f}
- GST: Rs.{quotation_summary.get('tax_amount', 0):,.0f}
- Grand Total: Rs.{quotation_summary.get('grand_total', 0):,.0f}
- Number of line items: {quotation_summary.get('item_count', 0)}
"""

    prompt = f"""You are a professional interior design proposal writer for the Indian market.
Write a detailed, professional proposal for the following interior design project.

Project: {project_name}
Client: {client_name}
Type: {project_type}
Address: {address or 'Not specified'}
Style Preferences: {', '.join(style_preferences) if style_preferences else 'Modern'}
Special Requirements: {special_requirements or 'None'}
{f'Designer Notes: {style_notes}' if style_notes else ''}

Rooms:
{rooms_text}

{quotation_text}

Write these 7 sections. Label each section clearly with the heading in CAPS.

1. EXECUTIVE SUMMARY
Write 2-3 paragraphs overview of the project for the client.

2. SCOPE OF WORK
Describe what will be done in each room — false ceiling, flooring, painting, carpentry, electrical, etc.

3. DESIGN APPROACH
Describe the design philosophy, material choices, and color palette.

4. MATERIAL SPECIFICATIONS
List key materials and Indian brands: Asian Paints, Kajaria, Greenply, Hettich, Hafele, Saint-Gobain, etc.

5. TIMELINE AND PHASES
Create a phase-wise timeline with estimated durations for each phase.

6. TERMS AND CONDITIONS
Write standard interior design project terms (5-6 points).

7. PAYMENT SCHEDULE
Create a milestone-based payment structure (advance, civil work, carpentry, finishing, handover).

IMPORTANT: Do NOT include specific pricing numbers. The quotation has the exact numbers. Focus on describing the work, approach, and quality.
Use Indian English. Be professional and detailed."""

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 3000,
                    },
                },
            )

            if response.status_code != 200:
                logger.error("Ollama API error: %d - %s", response.status_code, response.text[:200])
                return _placeholder_proposal(project_name, client_name, rooms_summary)

            data = response.json()
            content = data.get("response", "")

            if not content.strip():
                logger.warning("Ollama returned empty response")
                return _placeholder_proposal(project_name, client_name, rooms_summary)

            sections = _parse_sections(content)
            logger.info("AI proposal generated for project: %s (model: %s)", project_name, OLLAMA_MODEL)
            return sections

    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama at %s. Is it running?", OLLAMA_URL)
        return _placeholder_proposal(project_name, client_name, rooms_summary)
    except Exception:
        logger.exception("Ollama API call failed")
        return _placeholder_proposal(project_name, client_name, rooms_summary)


SUPPORTED_LANGUAGES = {
    "tamil": "Tamil (தமிழ்)",
    "hindi": "Hindi (हिन्दी)",
    "telugu": "Telugu (తెలుగు)",
    "kannada": "Kannada (ಕನ್ನಡ)",
    "malayalam": "Malayalam (മലയാളം)",
    "marathi": "Marathi (मराठी)",
    "bengali": "Bengali (বাংলা)",
    "gujarati": "Gujarati (ગુજરાતી)",
}


async def translate_text(text: str, target_language: str) -> str:
    """Translate text to a local Indian language using Ollama."""
    lang_name = SUPPORTED_LANGUAGES.get(target_language, target_language)

    prompt = f"""Translate the following interior design proposal text to {lang_name}.

Rules:
- Keep technical terms like "false ceiling", "modular kitchen", "vitrified tiles" in English (these are commonly used in {lang_name} as-is)
- Keep brand names in English (Asian Paints, Kajaria, Hettich, etc.)
- Keep all numbers and measurements in English/Arabic numerals
- Translate the descriptive text naturally into {lang_name}
- Maintain the same paragraph structure and formatting
- Do NOT add any explanation, just return the translated text

Text to translate:
{text}"""

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 3000},
                },
            )

            if response.status_code != 200:
                logger.error("Ollama translate error: %d", response.status_code)
                return text

            data = response.json()
            translated = data.get("response", "").strip()
            if not translated:
                return text

            logger.info("Translated %d chars to %s", len(text), target_language)
            return translated

    except Exception:
        logger.exception("Translation failed for %s", target_language)
        return text


async def translate_proposal(sections: dict, target_language: str) -> dict:
    """Translate all proposal sections to a target language."""
    translated = {}
    for key, value in sections.items():
        if value and isinstance(value, str) and value.strip():
            translated[key] = await translate_text(value, target_language)
        else:
            translated[key] = value
    return translated


def _parse_sections(content: str) -> dict:
    """Parse AI response into separate proposal sections."""
    sections = {
        "executive_summary": "",
        "scope_of_work": "",
        "design_approach": "",
        "material_specifications": "",
        "timeline_phases": "",
        "terms_and_conditions": "",
        "payment_schedule": "",
    }

    section_markers = {
        "EXECUTIVE SUMMARY": "executive_summary",
        "SCOPE OF WORK": "scope_of_work",
        "DESIGN APPROACH": "design_approach",
        "MATERIAL SPECIFICATIONS": "material_specifications",
        "MATERIAL SPECIFICATION": "material_specifications",
        "TIMELINE": "timeline_phases",
        "PHASES": "timeline_phases",
        "TERMS AND CONDITIONS": "terms_and_conditions",
        "TERMS & CONDITIONS": "terms_and_conditions",
        "PAYMENT SCHEDULE": "payment_schedule",
        "PAYMENT STRUCTURE": "payment_schedule",
    }

    current_key = None
    current_lines: list[str] = []

    for line in content.split("\n"):
        stripped = line.strip().upper()
        # Remove markdown headers like ## or **
        cleaned = stripped.replace("#", "").replace("*", "").strip()
        matched = False
        for marker, key in section_markers.items():
            if marker in cleaned:
                if current_key and current_lines:
                    sections[current_key] = "\n".join(current_lines).strip()
                current_key = key
                current_lines = []
                matched = True
                break
        if not matched and current_key:
            current_lines.append(line)

    if current_key and current_lines:
        sections[current_key] = "\n".join(current_lines).strip()

    return sections


def _placeholder_proposal(project_name: str, client_name: str, rooms_summary: list[dict]) -> dict:
    """Generate placeholder proposal text when AI is not available."""
    room_names = [r["name"] for r in rooms_summary]
    rooms_list = ", ".join(room_names) if room_names else "all designated rooms"

    return {
        "executive_summary": f"We are pleased to present this interior design proposal for {project_name} for {client_name}. Our team will transform your space with thoughtful design, quality materials, and expert craftsmanship. This proposal covers the complete interior design and execution for {rooms_list}.",
        "scope_of_work": f"The scope of work includes design, material procurement, and execution for: {rooms_list}. Work includes civil modifications, false ceiling, flooring, painting, electrical work, carpentry, and furnishing as detailed in the accompanying quotation.",
        "design_approach": "Our design approach combines contemporary aesthetics with functional space planning. We focus on creating harmonious living spaces that reflect your lifestyle and preferences, using a carefully curated palette of materials and finishes.",
        "material_specifications": "All materials used will be of premium quality sourced from reputed brands. Plywood: BWP grade (Greenply/Century). Hardware: Hettich/Hafele soft-close fittings. Paints: Asian Paints Royale range. Tiles: Kajaria/Somany. Laminates: Merino/Greenlam.",
        "timeline_phases": "Phase 1: Design Development (1-2 weeks)\nPhase 2: Material Procurement (2-3 weeks)\nPhase 3: Civil & Electrical Work (2-3 weeks)\nPhase 4: Carpentry & False Ceiling (3-4 weeks)\nPhase 5: Painting & Finishing (1-2 weeks)\nPhase 6: Furnishing & Handover (1 week)\n\nEstimated total duration: 10-15 weeks from approval.",
        "terms_and_conditions": "1. This proposal is valid for 30 days from the date of issue.\n2. Any changes to the approved design will be treated as a variation and may affect the timeline and cost.\n3. The client shall provide clear and unobstructed access to the site during working hours.\n4. All statutory approvals, if required, shall be the responsibility of the client.\n5. Material rates are subject to change based on market conditions at the time of procurement.",
        "payment_schedule": "Payment Milestone Structure:\n- 40% advance on confirmation\n- 20% on completion of civil and electrical work\n- 20% on completion of carpentry\n- 15% on completion of painting and finishing\n- 5% on final handover and inspection",
    }
