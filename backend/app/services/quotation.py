import logging
import math
import uuid
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.exceptions import BadRequestError, NotFoundError
from app.models.project import Project, Room
from app.models.quotation import (
    DiscountType,
    Quotation,
    QuotationLineItem,
    QuotationSection,
    QuotationStatus,
    RateSource,
)
from app.models.rate_card import DesignerRateCard, ProjectRateOverride, RateCardCategory
from app.schemas.quotation import GenerateQuotationRequest, UpdateLineItemRequest

logger = logging.getLogger(__name__)


def _resolve_rate(db: Session, designer_rate_id: int, project_id: int) -> tuple[Decimal, str]:
    """Resolve rate using 3-layer system. Returns (rate, source)."""
    # Check project override first
    override = db.query(ProjectRateOverride).filter(
        ProjectRateOverride.project_id == project_id,
        ProjectRateOverride.designer_rate_id == designer_rate_id,
    ).first()
    if override:
        return override.override_rate, "project_override"

    # Designer master rate
    designer_rate = db.query(DesignerRateCard).filter(DesignerRateCard.id == designer_rate_id).first()
    if not designer_rate:
        raise NotFoundError("Rate card item")
    return designer_rate.rate_per_unit, "designer_master"


TWO_PLACES = Decimal("0.01")


def _get_quantity_for_room_item(room: Room, unit: str, item_name: str) -> Decimal:
    """Calculate quantity based on room measurements. Returns Decimal rounded to 2 places."""
    item_lower = item_name.lower()

    if unit == "sqft":
        if any(kw in item_lower for kw in ["flooring", "floor", "tile", "vitrified", "marble", "laminate", "vinyl", "carpet"]):
            return room.area_sqft  # already Decimal quantized
        elif any(kw in item_lower for kw in ["ceiling", "false ceiling", "gypsum", "pop"]):
            return room.ceiling_area_sqft
        elif any(kw in item_lower for kw in ["paint", "putty", "emulsion", "texture", "wallpaper", "plaster", "wall panel"]):
            return room.wall_area_sqft
        else:
            return room.area_sqft
    elif unit == "rft":
        return room.perimeter
    elif unit == "point":
        if "electrical" in item_lower or "wiring" in item_lower or "light" in item_lower or "switch" in item_lower:
            return Decimal(room.electrical_points)
        elif "plumbing" in item_lower:
            return Decimal(room.plumbing_points)
        return Decimal("1")
    elif unit in ("nos", "set", "lumpsum"):
        return Decimal("1")
    else:
        return Decimal("1")


def generate_quotation(db: Session, user_id: int, data: GenerateQuotationRequest) -> Quotation:
    """Generate a quotation from room measurements x rate card rates. PURE MATH."""
    project = db.query(Project).options(joinedload(Project.rooms)).filter(
        Project.id == data.project_id, Project.user_id == user_id
    ).first()
    if not project:
        raise NotFoundError("Project")

    # Get next version number — versioned per client across all their projects
    client_project_ids = [
        p.id for p in db.query(Project.id).filter(Project.client_id == project.client_id).all()
    ]
    max_version = db.query(Quotation).filter(Quotation.project_id.in_(client_project_ids)).count() if client_project_ids else 0
    version = max_version + 1

    # Generate quotation code: QT-001, QT-002, ...
    last_qt = db.query(Quotation).order_by(Quotation.id.desc()).first()
    next_qt_num = (last_qt.id + 1) if last_qt else 1
    quotation_code = f"QT-{next_qt_num:03d}"

    # Create quotation
    quotation = Quotation(
        project_id=project.id,
        quotation_code=quotation_code,
        version=version,
        tax_rate=Decimal(str(data.tax_rate)),
        notes=data.notes,
        terms_and_conditions=data.terms_and_conditions,
    )
    db.add(quotation)
    db.flush()

    # Group items by category
    sections_map: dict[int, QuotationSection] = {}
    rooms_map = {r.id: r for r in project.rooms}

    for item_input in data.items:
        room = rooms_map.get(item_input.room_id)
        if not room:
            raise BadRequestError(f"Room {item_input.room_id} not found in project")

        designer_rate = db.query(DesignerRateCard).filter(
            DesignerRateCard.id == item_input.designer_rate_id,
            DesignerRateCard.designer_id == user_id,
        ).first()
        if not designer_rate:
            raise NotFoundError(f"Rate card item {item_input.designer_rate_id}")

        # Resolve rate (3-layer)
        rate, rate_source = _resolve_rate(db, designer_rate.id, project.id)

        # Calculate quantity from room measurements or use override
        if item_input.quantity_override is not None:
            quantity = Decimal(str(item_input.quantity_override)).quantize(TWO_PLACES)
        else:
            quantity = _get_quantity_for_room_item(room, designer_rate.unit, designer_rate.item_name)

        # amount = round(quantity × unit_rate, 2) — NO floating point
        amount = (quantity * rate).quantize(TWO_PLACES)

        # Get or create section for this category
        cat_id = designer_rate.category_id
        if cat_id not in sections_map:
            category = db.query(RateCardCategory).filter(RateCardCategory.id == cat_id).first()
            section = QuotationSection(
                quotation_id=quotation.id,
                category_id=cat_id,
                section_name=category.name if category else "Other",
                sort_order=category.sort_order if category else 99,
            )
            db.add(section)
            db.flush()
            sections_map[cat_id] = section

        section = sections_map[cat_id]

        # gst_amount = round(amount × gst_rate / 100, 2) — NO floating point
        item_gst_rate = Decimal(str(item_input.gst_rate)).quantize(TWO_PLACES)
        item_gst_amount = (amount * item_gst_rate / Decimal("100")).quantize(TWO_PLACES)

        # Create line item
        line_item = QuotationLineItem(
            section_id=section.id,
            room_id=room.id,
            designer_rate_id=designer_rate.id,
            item_name=designer_rate.item_name,
            description=designer_rate.description,
            room_name=room.name,
            quantity=quantity,
            unit=designer_rate.unit,
            rate=rate,
            amount=amount,
            gst_rate=item_gst_rate,
            gst_amount=item_gst_amount,
            rate_source=RateSource(rate_source),
            notes=item_input.notes,
            sort_order=0,
        )
        db.add(line_item)

    db.flush()

    # Calculate section totals — sum of Decimal amounts, no float
    all_line_items = []
    for section in sections_map.values():
        items = db.query(QuotationLineItem).filter(QuotationLineItem.section_id == section.id).all()
        section.section_total = sum((item.amount for item in items), Decimal("0")).quantize(TWO_PLACES)
        all_line_items.extend(items)

    # subtotal = sum of all section totals (Decimal)
    subtotal = sum((s.section_total for s in sections_map.values()), Decimal("0")).quantize(TWO_PLACES)
    # tax = sum of per-item GST amounts (Decimal)
    total_gst = sum((li.gst_amount for li in all_line_items), Decimal("0")).quantize(TWO_PLACES)

    quotation.subtotal = subtotal
    quotation.taxable_amount = subtotal
    quotation.tax_amount = total_gst
    total_before_discount = (subtotal + total_gst).quantize(TWO_PLACES)

    # Discount — all Decimal, all quantized
    from app.models.client import Client
    client = db.query(Client).filter(Client.id == project.client_id).first()
    client_discount = Decimal(str(client.special_discount)).quantize(TWO_PLACES) if client and client.special_discount else Decimal("0")

    if data.discount_type == "fixed" and data.discount_value > 0:
        quotation.discount_type = DiscountType.fixed
        quotation.discount_value = Decimal(str(data.discount_value)).quantize(TWO_PLACES)
        quotation.discount_amount = quotation.discount_value
    elif client_discount > 0:
        quotation.discount_type = DiscountType.percentage
        quotation.discount_value = client_discount
        quotation.discount_amount = (total_before_discount * client_discount / Decimal("100")).quantize(TWO_PLACES)
    elif data.discount_type == "percentage" and data.discount_value > 0:
        quotation.discount_type = DiscountType.percentage
        quotation.discount_value = Decimal(str(data.discount_value)).quantize(TWO_PLACES)
        quotation.discount_amount = (total_before_discount * quotation.discount_value / Decimal("100")).quantize(TWO_PLACES)
    else:
        quotation.discount_amount = Decimal("0")

    quotation.grand_total = (total_before_discount - quotation.discount_amount).quantize(TWO_PLACES)

    db.commit()
    db.refresh(quotation)
    logger.info("Quotation generated: project=%d, version=%d, total=%.2f", project.id, version, quotation.grand_total)
    return quotation


def get_quotations(db: Session, user_id: int, project_id: int | None = None) -> list[dict]:
    """List all quotations for the user, enriched with project/client names and codes."""
    from app.models.client import Client

    query = (
        db.query(Quotation, Project.name, Project.id, Client.name, Client.client_code, Client.id)
        .join(Project, Quotation.project_id == Project.id)
        .join(Client, Project.client_id == Client.id)
        .filter(Project.user_id == user_id)
    )
    if project_id:
        query = query.filter(Quotation.project_id == project_id)

    results = query.order_by(Client.name, Project.name, Quotation.version).all()

    enriched = []
    for quotation, project_name, proj_id, client_name, client_code, client_id in results:
        q_dict = {
            "id": quotation.id,
            "quotation_code": quotation.quotation_code,
            "project_id": quotation.project_id,
            "project_name": project_name,
            "client_id": client_id,
            "client_name": client_name,
            "client_code": client_code,
            "version": quotation.version,
            "status": quotation.status.value if hasattr(quotation.status, "value") else quotation.status,
            "subtotal": float(quotation.subtotal),
            "discount_type": quotation.discount_type.value if quotation.discount_type and hasattr(quotation.discount_type, "value") else quotation.discount_type,
            "discount_value": float(quotation.discount_value),
            "discount_amount": float(quotation.discount_amount),
            "taxable_amount": float(quotation.taxable_amount),
            "tax_rate": float(quotation.tax_rate),
            "tax_amount": float(quotation.tax_amount),
            "grand_total": float(quotation.grand_total),
            "valid_until": quotation.valid_until.isoformat() if quotation.valid_until else None,
            "notes": quotation.notes,
            "terms_and_conditions": quotation.terms_and_conditions,
            "public_token": quotation.public_token,
            "sections": [],
            "created_at": quotation.created_at.isoformat() if quotation.created_at else None,
            "updated_at": quotation.updated_at.isoformat() if quotation.updated_at else None,
        }
        enriched.append(q_dict)
    return enriched


def get_quotation(db: Session, user_id: int, quotation_id: int) -> Quotation:
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.sections).joinedload(QuotationSection.line_items))
        .join(Project)
        .filter(Quotation.id == quotation_id, Project.user_id == user_id)
        .first()
    )
    if not quotation:
        raise NotFoundError("Quotation")
    return quotation


def get_quotation_by_token(db: Session, token: str) -> Quotation:
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.sections).joinedload(QuotationSection.line_items))
        .filter(Quotation.public_token == token)
        .first()
    )
    if not quotation:
        raise NotFoundError("Quotation")
    return quotation


def update_line_item(db: Session, user_id: int, quotation_id: int, line_item_id: int, data: UpdateLineItemRequest) -> QuotationLineItem:
    quotation = get_quotation(db, user_id, quotation_id)
    if quotation.status != QuotationStatus.draft:
        raise BadRequestError("Can only edit draft quotations")

    line_item = db.query(QuotationLineItem).filter(QuotationLineItem.id == line_item_id).first()
    if not line_item:
        raise NotFoundError("Line item")

    if data.rate is not None:
        line_item.rate = Decimal(str(data.rate)).quantize(TWO_PLACES)
        line_item.rate_source = RateSource.manual
    if data.quantity is not None:
        line_item.quantity = Decimal(str(data.quantity)).quantize(TWO_PLACES)
    if data.gst_rate is not None:
        line_item.gst_rate = Decimal(str(data.gst_rate)).quantize(TWO_PLACES)
    if data.notes is not None:
        line_item.notes = data.notes

    # amount = round(quantity × rate, 2), gst = round(amount × gst_rate / 100, 2)
    line_item.amount = (line_item.quantity * line_item.rate).quantize(TWO_PLACES)
    line_item.gst_amount = (line_item.amount * line_item.gst_rate / Decimal("100")).quantize(TWO_PLACES)
    db.commit()
    db.refresh(line_item)
    return line_item


def recalculate_quotation(db: Session, user_id: int, quotation_id: int) -> Quotation:
    """Recalculate all totals. Every number is Decimal, every result is quantize(0.01)."""
    quotation = get_quotation(db, user_id, quotation_id)

    all_items = []
    for section in quotation.sections:
        for li in section.line_items:
            li.amount = (li.quantity * li.rate).quantize(TWO_PLACES)
            li.gst_amount = (li.amount * li.gst_rate / Decimal("100")).quantize(TWO_PLACES)
            all_items.append(li)
        section.section_total = sum((li.amount for li in section.line_items), Decimal("0")).quantize(TWO_PLACES)

    quotation.subtotal = sum((s.section_total for s in quotation.sections), Decimal("0")).quantize(TWO_PLACES)
    quotation.taxable_amount = quotation.subtotal
    quotation.tax_amount = sum((li.gst_amount for li in all_items), Decimal("0")).quantize(TWO_PLACES)
    total_before_discount = (quotation.subtotal + quotation.tax_amount).quantize(TWO_PLACES)

    if quotation.discount_type == DiscountType.percentage:
        quotation.discount_amount = (total_before_discount * quotation.discount_value / Decimal("100")).quantize(TWO_PLACES)
    elif quotation.discount_type == DiscountType.fixed:
        quotation.discount_amount = quotation.discount_value
    else:
        quotation.discount_amount = Decimal("0")

    quotation.grand_total = (total_before_discount - quotation.discount_amount).quantize(TWO_PLACES)

    db.commit()
    db.refresh(quotation)
    logger.info("Quotation recalculated: id=%d, total=%.2f", quotation_id, quotation.grand_total)
    return quotation


def update_quotation_status(db: Session, user_id: int, quotation_id: int, status: str) -> Quotation:
    quotation = get_quotation(db, user_id, quotation_id)
    quotation.status = QuotationStatus(status)
    db.commit()
    db.refresh(quotation)
    return quotation
