import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from app.schemas.labour import (
    AssignLabourRequest,
    LabourCreate,
    LabourResponse,
    LabourUpdate,
    ProjectLabourResponse,
    UpdateAssignmentRequest,
)
from app.schemas.user import MessageResponse
from app.services import labour as labour_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/labours", tags=["Labour Management"])


# --- Labour Directory ---

@router.get("", response_model=list[LabourResponse])
async def list_labours(
    specialization: str = "",
    search: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return labour_service.get_labours(db, current_user.id, specialization, search)


@router.post("", response_model=LabourResponse, status_code=201)
async def create_labour(
    data: LabourCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return labour_service.create_labour(db, current_user.id, data)


@router.get("/{labour_id}", response_model=LabourResponse)
async def get_labour(
    labour_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return labour_service.get_labour(db, current_user.id, labour_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{labour_id}", response_model=LabourResponse)
async def update_labour(
    labour_id: int,
    data: LabourUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return labour_service.update_labour(db, current_user.id, labour_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{labour_id}", response_model=MessageResponse)
async def delete_labour(
    labour_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        labour_service.delete_labour(db, current_user.id, labour_id)
        return MessageResponse(message="Labour deactivated")
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# --- Bulk Upload / Export ---

@router.get("/template/download")
async def download_template():
    """Download Excel template for bulk labour upload."""
    output = labour_service.generate_template()
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=labour_template.xlsx"},
    )


@router.post("/bulk-upload")
async def bulk_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Please upload an .xlsx file")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    try:
        result = labour_service.bulk_upload(db, current_user.id, content)
        return result
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/export/excel")
async def export_excel(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Export all labourers as Excel."""
    output = labour_service.export_labours(db, current_user.id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=labours.xlsx"},
    )


# --- Project Labour Assignments ---

@router.get("/project/{project_id}", response_model=list[ProjectLabourResponse])
async def get_project_labours(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return labour_service.get_project_labours(db, current_user.id, project_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/project/{project_id}/assign", response_model=ProjectLabourResponse, status_code=201)
async def assign_labour(
    project_id: int,
    data: AssignLabourRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        assignment = labour_service.assign_labour(db, current_user.id, project_id, data)
        # Return enriched response
        labours = labour_service.get_project_labours(db, current_user.id, project_id)
        return next((l for l in labours if l["id"] == assignment.id), assignment)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/project/{project_id}/assignment/{assignment_id}", response_model=MessageResponse)
async def update_assignment(
    project_id: int,
    assignment_id: int,
    data: UpdateAssignmentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        labour_service.update_assignment(db, current_user.id, project_id, assignment_id, data)
        return MessageResponse(message="Assignment updated")
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/project/{project_id}/assignment/{assignment_id}", response_model=MessageResponse)
async def remove_assignment(
    project_id: int,
    assignment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        labour_service.remove_assignment(db, current_user.id, project_id, assignment_id)
        return MessageResponse(message="Labour removed from project")
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
