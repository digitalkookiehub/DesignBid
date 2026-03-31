import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.base import TimestampMixin


class ProposalStatus(enum.Enum):
    draft = "draft"
    sent = "sent"
    approved = "approved"
    rejected = "rejected"


class Proposal(Base, TimestampMixin):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(300), nullable=False)
    status = Column(Enum(ProposalStatus), default=ProposalStatus.draft, nullable=False)

    # AI-generated sections
    executive_summary = Column(Text, nullable=True)
    scope_of_work = Column(Text, nullable=True)
    design_approach = Column(Text, nullable=True)
    material_specifications = Column(Text, nullable=True)
    timeline_phases = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    payment_schedule = Column(Text, nullable=True)

    ai_generated = Column(Boolean, default=False, nullable=False)
    ai_model_used = Column(String(50), nullable=True)
    public_token = Column(String(36), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))
    sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="proposals")
    quotation = relationship("Quotation")
