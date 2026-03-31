import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from pydantic import BaseModel

from app.schemas.proposal import (
    GenerateProposalRequest,
    ProposalResponse,
    ProposalStatusUpdate,
    ProposalUpdate,
)
from app.services import proposal as proposal_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/proposals", tags=["Proposals"])


@router.post("/generate", response_model=ProposalResponse, status_code=201)
async def generate_proposal(
    data: GenerateProposalRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return await proposal_service.generate_proposal(
            db, current_user.id, data.project_id, data.quotation_id, data.title, data.style_notes
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/public/{token}", response_model=ProposalResponse)
async def get_public_proposal(token: str, db: Session = Depends(get_db)):
    try:
        return proposal_service.get_proposal_by_token(db, token)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return proposal_service.get_proposal(db, current_user.id, proposal_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(
    proposal_id: int,
    data: ProposalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return proposal_service.update_proposal(db, current_user.id, proposal_id, data.model_dump(exclude_unset=True))
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{proposal_id}/status", response_model=ProposalResponse)
async def update_status(
    proposal_id: int,
    data: ProposalStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return proposal_service.update_proposal_status(db, current_user.id, proposal_id, data.status)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


class TranslateRequest(BaseModel):
    language: str  # tamil, hindi, telugu, etc.


@router.post("/{proposal_id}/translate", response_model=ProposalResponse)
async def translate_proposal(
    proposal_id: int,
    data: TranslateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Translate proposal to a local Indian language using AI."""
    from app.services.ai import SUPPORTED_LANGUAGES, translate_proposal as do_translate

    if data.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language. Choose from: {list(SUPPORTED_LANGUAGES.keys())}")

    try:
        proposal = proposal_service.get_proposal(db, current_user.id, proposal_id)

        sections = {
            "executive_summary": proposal.executive_summary or "",
            "scope_of_work": proposal.scope_of_work or "",
            "design_approach": proposal.design_approach or "",
            "material_specifications": proposal.material_specifications or "",
            "timeline_phases": proposal.timeline_phases or "",
            "terms_and_conditions": proposal.terms_and_conditions or "",
            "payment_schedule": proposal.payment_schedule or "",
        }

        translated = await do_translate(sections, data.language)

        # Save as new version (update in place)
        return proposal_service.update_proposal(db, current_user.id, proposal_id, translated)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/languages")
async def list_languages():
    """List supported translation languages."""
    from app.services.ai import SUPPORTED_LANGUAGES
    return [{"code": k, "name": v} for k, v in SUPPORTED_LANGUAGES.items()]
