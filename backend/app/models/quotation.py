import enum
import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.base import TimestampMixin


class QuotationStatus(enum.Enum):
    draft = "draft"
    sent = "sent"
    approved = "approved"
    revised = "revised"
    rejected = "rejected"


class DiscountType(enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class RateSource(enum.Enum):
    system_default = "system_default"
    designer_master = "designer_master"
    project_override = "project_override"
    manual = "manual"


class Quotation(Base, TimestampMixin):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_code = Column(String(20), unique=True, index=True, nullable=True)  # QT-001
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    status = Column(Enum(QuotationStatus), default=QuotationStatus.draft, nullable=False)
    subtotal = Column(Numeric(14, 2), default=0, nullable=False)
    discount_type = Column(Enum(DiscountType), nullable=True)
    discount_value = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(14, 2), default=0, nullable=False)
    taxable_amount = Column(Numeric(14, 2), default=0, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=18, nullable=False)  # GST %
    tax_amount = Column(Numeric(14, 2), default=0, nullable=False)
    grand_total = Column(Numeric(14, 2), default=0, nullable=False)
    valid_until = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    terms_and_conditions = Column(Text, nullable=True)
    public_token = Column(String(36), unique=True, index=True, nullable=False, default=lambda: str(uuid.uuid4()))

    # Relationships
    project = relationship("Project", back_populates="quotations")
    sections = relationship("QuotationSection", back_populates="quotation", cascade="all, delete-orphan", order_by="QuotationSection.sort_order")


class QuotationSection(Base):
    __tablename__ = "quotation_sections"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("rate_card_categories.id"), nullable=True)
    section_name = Column(String(200), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    section_total = Column(Numeric(14, 2), default=0, nullable=False)

    # Relationships
    quotation = relationship("Quotation", back_populates="sections")
    category = relationship("RateCardCategory")
    line_items = relationship("QuotationLineItem", back_populates="section", cascade="all, delete-orphan", order_by="QuotationLineItem.sort_order")


class QuotationLineItem(Base):
    __tablename__ = "quotation_line_items"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("quotation_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    designer_rate_id = Column(Integer, ForeignKey("designer_rate_cards.id", ondelete="SET NULL"), nullable=True)
    item_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    room_name = Column(String(100), nullable=True)  # denormalized
    quantity = Column(Numeric(12, 2), nullable=False)
    unit = Column(String(20), nullable=False)
    rate = Column(Numeric(12, 2), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)  # quantity × rate
    gst_rate = Column(Numeric(5, 2), default=18, nullable=False)  # per-item GST %
    gst_amount = Column(Numeric(14, 2), default=0, nullable=False)  # amount × gst_rate / 100
    rate_source = Column(Enum(RateSource), default=RateSource.designer_master, nullable=False)
    notes = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    section = relationship("QuotationSection", back_populates="line_items")
    room = relationship("Room")
    designer_rate = relationship("DesignerRateCard")
