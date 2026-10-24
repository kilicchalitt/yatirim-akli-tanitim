"""
Security utilities: password hashing (bcrypt) and JWT token management.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import settings


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

def create_access_token(data: dict[str, Any]) -> str:
    """
    Create a short-lived access token (default 30 min).

    Args:
        data: Payload data; must include 'sub' (user id as a string).

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict[str, Any], expires_at: datetime) -> str:
    """
    Create a long-lived refresh token.

    Args:
        data: Payload data; must include 'sub' (user id as a string) and 'jti' (the id of
            its row in refresh_tokens, see auth_service).
        expires_at: Expiry, the same instant that is stored in the row.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    to_encode.update({"exp": expires_at, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """
    Decode and validate a JWT token.

    Every token we issue has ``exp``, ``sub`` and ``type``; one without them is not ours
    (or never expires), so it is rejected even when the signature is valid.

    Returns:
        The token payload dict if valid, or None if expired/invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub", "type"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def user_id_from_payload(payload: dict[str, Any]) -> int | None:
    """
    Read the user id from a decoded token payload.

    Tokens carry the id as a string ``sub`` (RFC 7519; PyJWT >= 2.10 rejects
    other types). Returns None for a missing, non-string or non-numeric ``sub``
    so callers can answer 401.
    """
    sub = payload.get("sub")
    if not isinstance(sub, str) or not (sub.isascii() and sub.isdigit()):
        return None
    return int(sub)
