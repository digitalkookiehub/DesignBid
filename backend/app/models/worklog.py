import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class WorkStatus(enum.Enum):
    completed = "completed"       # Work done as planned
    partial = "partial"           # Some work done, not full day
    no_work = "no_work"           # No work happened
    holiday = "holiday"           # Planned holiday
    rain = "rain"                 # Stopped due to rain
    material_delay = "material_delay"  # Material not available
    labour_absent = "labour_absent"    # Labour didn't show up
    client_hold = "client_hold"   # Client asked to pause


class DailyWorkLog(Base, TimestampMixin):
    __tablename__ = "daily_work_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, nullable=False)
    status = Column(Enum(WorkStatus), default=WorkStatus.completed, nullable=False)
    summary = Column(Text, nullable=True)  # What work was done today
    work_category = Column(String(100), nullable=True)  # Civil, Carpentry, Painting, etc.
    workers_present = Column(Integer, nullable=True)
    hours_worked = Column(Numeric(4, 1), nullable=True)  # e.g., 8.5 hours
    delay_reason = Column(Text, nullable=True)  # Why no work / partial
    photos_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    project = relationship("Project", backref="work_logs")

    __table_args__ = (
        Index("ix_worklog_project_date", "project_id", "log_date", unique=True),
    )
