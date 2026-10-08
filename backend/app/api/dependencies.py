from typing import Generator, Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.config import settings


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> Optional[str]:
    """
    Optional API Key validator for secured routes.
    If no key configured or dev mode, passes through.
    """
    if not settings.DEBUG and settings.SECRET_KEY:
        if not x_api_key or x_api_key != settings.SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-API-Key header"
            )
    return x_api_key
