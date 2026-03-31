import logging

from sqlalchemy.orm import Session, joinedload

from app.exceptions import BadRequestError, NotFoundError
from app.models.project import Project
from app.models.proposal import Proposal, ProposalStatus
from app.models.quotation import Quotation
from app.services.ai import generate_proposal_text

logger = logging.getLogger(__name__)


async def generate_proposal(
    db: Session,
    user_id: int,
    project_id: int,
    quotation_id: int | None = None,
    title: str | None = None,
    style_notes: str | None = None,
) -> Proposal:
    """Generate an AI-powered proposal for a project."""
    project = (
        db.query(Project)
        .options(joinedload(Project.rooms), joinedload(Project.client))
        .filter(Project.id == project_id, Project.user_id == user_id)
        .first()
    )
    if not project:
        raise NotFoundError("Project")

    # Build rooms summary for AI
    rooms_summary = []
    for room in project.rooms:
        work_types = []
        if room.has_false_ceiling:
            work_types.append("false ceiling")
        if room.has_flooring_work:
            work_types.append("flooring")
        if room.has_painting:
            work_types.append("painting")
        if room.has_carpentry:
            work_types.append("carpentry")
        rooms_summary.append({
            "name": room.name,
            "type": room.room_type.value if hasattr(room.room_type, "value") else str(room.room_type),
            "area_sqft": room.area_sqft,
            "work_types": work_types,
        })

    # Get quotation summary if provided
    quotation_summary = None
    if quotation_id:
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if quotation:
            item_count = sum(len(s.line_items) for s in quotation.sections) if quotation.sections else 0
            quotation_summary = {
                "subtotal": float(quotation.subtotal),
                "tax_amount": float(quotation.tax_amount),
                "grand_total": float(quotation.grand_total),
                "item_count": item_count,
            }

    # Generate AI text
    sections = await generate_proposal_text(
        project_name=project.name,
        client_name=project.client.name if project.client else "Client",
        project_type=project.project_type.value if hasattr(project.project_type, "value") else str(project.project_type),
        address=project.address,
        style_preferences=project.style_preferences or [],
        rooms_summary=rooms_summary,
        quotation_summary=quotation_summary,
        special_requirements=project.special_requirements,
        style_notes=style_notes,
    )

    proposal = Proposal(
        project_id=project_id,
        quotation_id=quotation_id,
        title=title or f"Interior Design Proposal - {project.name}",
        executive_summary=sections.get("executive_summary"),
        scope_of_work=sections.get("scope_of_work"),
        design_approach=sections.get("design_approach"),
        material_specifications=sections.get("material_specifications"),
        timeline_phases=sections.get("timeline_phases"),
        terms_and_conditions=sections.get("terms_and_conditions"),
        payment_schedule=sections.get("payment_schedule"),
        ai_generated=True,
        ai_model_used="gpt-4",
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    logger.info("Proposal generated: project=%d, id=%d", project_id, proposal.id)
    return proposal


def get_proposal(db: Session, user_id: int, proposal_id: int) -> Proposal:
    proposal = (
        db.query(Proposal)
        .join(Project)
        .filter(Proposal.id == proposal_id, Project.user_id == user_id)
        .first()
    )
    if not proposal:
        raise NotFoundError("Proposal")
    return proposal


def get_proposal_by_token(db: Session, token: str) -> Proposal:
    proposal = db.query(Proposal).filter(Proposal.public_token == token).first()
    if not proposal:
        raise NotFoundError("Proposal")
    return proposal


def update_proposal(db: Session, user_id: int, proposal_id: int, data: dict) -> Proposal:
    proposal = get_proposal(db, user_id, proposal_id)
    if proposal.status != ProposalStatus.draft:
        raise BadRequestError("Can only edit draft proposals")
    for key, value in data.items():
        if hasattr(proposal, key) and value is not None:
            setattr(proposal, key, value)
    db.commit()
    db.refresh(proposal)
    return proposal


def update_proposal_status(db: Session, user_id: int, proposal_id: int, status: str) -> Proposal:
    proposal = get_proposal(db, user_id, proposal_id)
    proposal.status = ProposalStatus(status)
    db.commit()
    db.refresh(proposal)
    return proposal
