import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.project import Project
from app.models.worklog import DailyWorkLog, WorkStatus
from app.schemas.worklog import WorkLogCreate, WorkLogSummary, WorkLogUpdate

logger = logging.getLogger(__name__)


def get_work_logs(
    db: Session, user_id: int, project_id: int,
    from_date: date | None = None, to_date: date | None = None,
) -> list[DailyWorkLog]:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    query = db.query(DailyWorkLog).filter(DailyWorkLog.project_id == project_id)
    if from_date:
        query = query.filter(DailyWorkLog.log_date >= from_date)
    if to_date:
        query = query.filter(DailyWorkLog.log_date <= to_date)
    return query.order_by(DailyWorkLog.log_date.desc()).all()


def create_work_log(db: Session, user_id: int, project_id: int, data: WorkLogCreate) -> DailyWorkLog:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    existing = db.query(DailyWorkLog).filter(
        DailyWorkLog.project_id == project_id,
        DailyWorkLog.log_date == data.log_date,
    ).first()
    if existing:
        raise ConflictError(f"Work log already exists for {data.log_date}")

    log = DailyWorkLog(
        project_id=project_id,
        user_id=user_id,
        log_date=data.log_date,
        status=data.status,
        summary=data.summary,
        work_category=data.work_category,
        workers_present=data.workers_present,
        hours_worked=Decimal(str(data.hours_worked)) if data.hours_worked else None,
        delay_reason=data.delay_reason,
        notes=data.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    logger.info("Work log created: project=%d, date=%s, status=%s", project_id, data.log_date, data.status)
    return log


def update_work_log(db: Session, user_id: int, project_id: int, log_id: int, data: WorkLogUpdate) -> DailyWorkLog:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    log = db.query(DailyWorkLog).filter(DailyWorkLog.id == log_id, DailyWorkLog.project_id == project_id).first()
    if not log:
        raise NotFoundError("Work log")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "hours_worked" and value is not None:
            value = Decimal(str(value))
        setattr(log, key, value)
    db.commit()
    db.refresh(log)
    return log


def delete_work_log(db: Session, user_id: int, project_id: int, log_id: int) -> None:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    log = db.query(DailyWorkLog).filter(DailyWorkLog.id == log_id, DailyWorkLog.project_id == project_id).first()
    if not log:
        raise NotFoundError("Work log")
    db.delete(log)
    db.commit()


def get_summary(db: Session, user_id: int, project_id: int) -> WorkLogSummary:
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    logs = db.query(DailyWorkLog).filter(DailyWorkLog.project_id == project_id).all()

    total = len(logs)
    working = sum(1 for l in logs if l.status == WorkStatus.completed)
    partial = sum(1 for l in logs if l.status == WorkStatus.partial)
    no_work = sum(1 for l in logs if l.status == WorkStatus.no_work)
    delays = sum(1 for l in logs if l.status in (
        WorkStatus.rain, WorkStatus.material_delay, WorkStatus.labour_absent, WorkStatus.client_hold, WorkStatus.holiday
    ))
    total_hours = float(sum((l.hours_worked or Decimal("0")) for l in logs))

    return WorkLogSummary(
        total_days=total,
        working_days=working,
        no_work_days=no_work,
        partial_days=partial,
        delay_days=delays,
        total_hours=total_hours,
    )


def get_missing_dates(db: Session, user_id: int, project_id: int, from_date: date, to_date: date) -> list[date]:
    """Find dates with no work log entry (gaps in tracking)."""
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise NotFoundError("Project")

    logged_dates = {
        log.log_date
        for log in db.query(DailyWorkLog.log_date).filter(
            DailyWorkLog.project_id == project_id,
            DailyWorkLog.log_date >= from_date,
            DailyWorkLog.log_date <= to_date,
        ).all()
    }

    missing = []
    current = from_date
    while current <= to_date:
        if current.weekday() < 6 and current not in logged_dates:  # Skip Sundays (weekday=6)
            missing.append(current)
        current += timedelta(days=1)

    return missing
