import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from app.schemas.quotation import (
    GenerateQuotationRequest,
    QuotationResponse,
    QuotationStatusUpdate,
    UpdateLineItemRequest,
    QuotationLineItemResponse,
)
from app.schemas.user import MessageResponse
from app.services import quotation as quotation_service
from app.services import export as export_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=list[QuotationResponse])
async def list_quotations(
    project_id: int | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return quotation_service.get_quotations(db, current_user.id, project_id)


@router.post("/generate", response_model=QuotationResponse, status_code=201)
async def generate_quotation(
    data: GenerateQuotationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return quotation_service.generate_quotation(db, current_user.id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/public/{token}", response_model=QuotationResponse)
async def get_public_quotation(token: str, db: Session = Depends(get_db)):
    try:
        return quotation_service.get_quotation_by_token(db, token)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{quotation_id}", response_model=QuotationResponse)
async def get_quotation(
    quotation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return quotation_service.get_quotation(db, current_user.id, quotation_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{quotation_id}/line-items/{item_id}", response_model=QuotationLineItemResponse)
async def update_line_item(
    quotation_id: int,
    item_id: int,
    data: UpdateLineItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return quotation_service.update_line_item(db, current_user.id, quotation_id, item_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{quotation_id}/recalculate", response_model=QuotationResponse)
async def recalculate(
    quotation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return quotation_service.recalculate_quotation(db, current_user.id, quotation_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{quotation_id}/status", response_model=QuotationResponse)
async def update_status(
    quotation_id: int,
    data: QuotationStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return quotation_service.update_quotation_status(db, current_user.id, quotation_id, data.status)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


def _get_user_id_from_token(token: str | None) -> int | None:
    """Extract user ID from JWT token query param."""
    if not token:
        return None
    from app.auth.jwt import decode_token
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return int(payload.get("sub", 0))
    return None


@router.get("/{quotation_id}/export/xlsx")
async def export_xlsx(
    quotation_id: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    user_id = _get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        output = export_service.export_quotation_xlsx(db, user_id, quotation_id)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=quotation_{quotation_id}.xlsx"},
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{quotation_id}/export/pdf")
async def export_pdf(
    quotation_id: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    """Export quotation as HTML page (printable as PDF via Ctrl+P in browser)."""
    user_id = _get_user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        html = export_service.export_quotation_html(db, user_id, quotation_id)
        return HTMLResponse(content=html)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
