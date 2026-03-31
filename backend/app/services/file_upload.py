import logging
import os
import uuid

from fastapi import UploadFile

from app.config import settings
from app.exceptions import BadRequestError

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


async def save_upload(file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_TYPES:
        raise BadRequestError(f"File type {file.content_type} not allowed")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise BadRequestError(f"File too large. Max size: {settings.MAX_FILE_SIZE // 1024 // 1024}MB")

    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(content)

    logger.info("File uploaded: %s (%d bytes)", filename, len(content))

    return {
        "file_name": file.filename or "file",
        "file_url": f"/uploads/{filename}",
        "file_type": file.content_type or "application/octet-stream",
        "file_size": len(content),
    }
