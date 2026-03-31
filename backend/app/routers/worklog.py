import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_active_user
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from app.schemas.user import MessageResponse
from app.schemas.worklog import WorkLogCreate, WorkLogResponse, WorkLogSummary, WorkLogUpdate
from app.services import worklog as worklog_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}/worklogs", tags=["Daily Work Log"])


@router.get("", response_model=list[WorkLogResponse])
async def list_work_logs(
    project_id: int,
    from_date: date | None = None,
    to_date: date | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return worklog_service.get_work_logs(db, current_user.id, project_id, from_date, to_date)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("", response_model=WorkLogResponse, status_code=201)
async def create_work_log(
    project_id: int,
    data: WorkLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return worklog_service.create_work_log(db, current_user.id, project_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{log_id}", response_model=WorkLogResponse)
async def update_work_log(
    project_id: int,
    log_id: int,
    data: WorkLogUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return worklog_service.update_work_log(db, current_user.id, project_id, log_id, data)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{log_id}", response_model=MessageResponse)
async def delete_work_log(
    project_id: int,
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        worklog_service.delete_work_log(db, current_user.id, project_id, log_id)
        return MessageResponse(message="Work log deleted")
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/summary", response_model=WorkLogSummary)
async def get_summary(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        return worklog_service.get_summary(db, current_user.id, project_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/missing-dates")
async def get_missing_dates(
    project_id: int,
    from_date: date,
    to_date: date,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[date]:
    try:
        return worklog_service.get_missing_dates(db, current_user.id, project_id, from_date, to_date)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
