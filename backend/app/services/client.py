import logging
import math

from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.client import Client, ClientNote
from app.schemas.client import ClientCreate, ClientUpdate, PaginatedClientResponse

logger = logging.getLogger(__name__)


def get_clients(
    db: Session,
    user_id: int,
    page: int = 1,
    per_page: int = 10,
    search: str = "",
) -> PaginatedClientResponse:
    query = db.query(Client).filter(Client.user_id == user_id, Client.is_active == True)  # noqa: E712

    if search:
        query = query.filter(
            (Client.name.ilike(f"%{search}%"))
            | (Client.email.ilike(f"%{search}%"))
            | (Client.company.ilike(f"%{search}%"))
        )

    total = query.count()
    items = query.order_by(Client.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedClientResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 1,
    )


def get_client(db: Session, user_id: int, client_id: int) -> Client:
    client = db.query(Client).filter(Client.id == client_id, Client.user_id == user_id, Client.is_active == True).first()  # noqa: E712
    if not client:
        raise NotFoundError("Client")
    return client


def create_client(db: Session, user_id: int, data: ClientCreate) -> Client:
    existing = db.query(Client).filter(
        Client.user_id == user_id,
        Client.email == data.email,
        Client.is_active == True,  # noqa: E712
    ).first()
    if existing:
        raise ConflictError("A client with this email already exists")

    # Generate client code: CLT-001, CLT-002, ...
    last_client = db.query(Client).order_by(Client.id.desc()).first()
    next_num = (last_client.id + 1) if last_client else 1
    client_code = f"CLT-{next_num:03d}"

    client = Client(user_id=user_id, client_code=client_code, **data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    logger.info("Client created: %s (id=%d)", client.name, client.id)
    return client


def update_client(db: Session, user_id: int, client_id: int, data: ClientUpdate) -> Client:
    client = get_client(db, user_id, client_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    logger.info("Client updated: id=%d", client_id)
    return client


def delete_client(db: Session, user_id: int, client_id: int) -> None:
    client = get_client(db, user_id, client_id)
    client.is_active = False
    db.commit()
    logger.info("Client soft-deleted: id=%d", client_id)


def add_note(db: Session, user_id: int, client_id: int, content: str) -> ClientNote:
    get_client(db, user_id, client_id)  # verify ownership
    note = ClientNote(client_id=client_id, user_id=user_id, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_notes(db: Session, user_id: int, client_id: int) -> list[ClientNote]:
    get_client(db, user_id, client_id)  # verify ownership
    return db.query(ClientNote).filter(ClientNote.client_id == client_id).order_by(ClientNote.created_at.desc()).all()
