import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from app.schemas.rate_card import (
    BulkUpdateRequest,
    DesignerRateCreate,
    DesignerRateResponse,
    DesignerRateUpdate,
    RateCardCategoryResponse,
    RateResolutionResponse,
    SystemDefaultRateResponse,
)
from app.schemas.user import MessageResponse
from app.services import rate_card as rate_card_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rate-cards", tags=["Rate Cards"])


@router.get("/categories", response_model=list[RateCardCategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    return rate_card_service.get_categories(db)


@router.get("/system-defaults", response_model=list[SystemDefaultRateResponse])
async def list_system_defaults(
    category_id: int | None = None, db: Session = Depends(get_db)
):
    return rate_card_service.get_system_defaults(db, category_id)


@router.get("/my-rates", response_model=list[DesignerRateResponse])
async def list_my_rates(
    category_id: int | None = None,
    search: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return rate_card_service.get_designer_rates(db, current_user.id, category_id, search)


@router.post("/my-rates", response_model=DesignerRateResponse, status_code=201)
async def create_my_rate(
    data: DesignerRateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return rate_card_service.create_designer_rate(db, current_user.id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/my-rates/{rate_id}", response_model=DesignerRateResponse)
async def update_my_rate(
    rate_id: int,
    data: DesignerRateUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return rate_card_service.update_designer_rate(db, current_user.id, rate_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/my-rates/{rate_id}", response_model=MessageResponse)
async def delete_my_rate(
    rate_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        rate_card_service.delete_designer_rate(db, current_user.id, rate_id)
        return MessageResponse(message="Rate card item deleted")
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/my-rates/bulk-update", response_model=MessageResponse)
async def bulk_update_my_rates(
    data: BulkUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    count = rate_card_service.bulk_update_rates(
        db, current_user.id, data.category_id, data.percentage
    )
    return MessageResponse(message=f"Updated {count} items by {data.percentage}%")


@router.post("/my-rates/initialize", response_model=MessageResponse)
async def initialize_from_defaults(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Initialize designer's rate card from system defaults (onboarding)."""
    count = rate_card_service.initialize_designer_rates_from_defaults(db, current_user.id)
    return MessageResponse(message=f"Initialized {count} rate card items from system defaults")


@router.get("/resolve/{designer_rate_id}", response_model=RateResolutionResponse)
async def resolve_rate(
    designer_rate_id: int,
    project_id: int | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return rate_card_service.resolve_rate(
            db, current_user.id, project_id, designer_rate_id
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/seed-defaults", response_model=MessageResponse)
async def seed_defaults(db: Session = Depends(get_db)):
    """Seed system default rates from JSON file. Admin only in production."""
    count = rate_card_service.seed_system_defaults(db)
    return MessageResponse(message=f"Seeded {count} system default rates")
