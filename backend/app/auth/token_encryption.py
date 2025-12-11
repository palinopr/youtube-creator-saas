"""
Token encryption utilities for secure OAuth credential storage.
Uses Fernet symmetric encryption (AES-128-CBC with HMAC).
"""

import json
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken

from ..config import get_settings

logger = logging.getLogger(__name__)


def get_fernet() -> Optional[Fernet]:
    """
    Get Fernet instance for encryption/decryption.
    Returns None if encryption key is not configured.
    """
    settings = get_settings()

    if not settings.token_encryption_key:
        logger.warning(
            "TOKEN_ENCRYPTION_KEY not set. Tokens will not be encrypted. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
        return None

    try:
        return Fernet(settings.token_encryption_key.encode())
    except Exception as e:
        logger.error(f"Invalid TOKEN_ENCRYPTION_KEY: {e}")
        return None


def encrypt_credentials(credentials: dict) -> Optional[str]:
    """
    Encrypt OAuth credentials dictionary to a string.
    Returns base64-encoded encrypted string, or None if encryption fails.
    """
    fernet = get_fernet()

    if not fernet:
        # Fallback: store as plain JSON (not recommended for production)
        logger.warning("Storing credentials without encryption (development mode)")
        return json.dumps(credentials)

    try:
        json_str = json.dumps(credentials)
        encrypted = fernet.encrypt(json_str.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Failed to encrypt credentials: {e}")
        return None


def decrypt_credentials(encrypted_str: str) -> Optional[dict]:
    """
    Decrypt OAuth credentials from encrypted string.
    Returns credentials dictionary, or None if decryption fails.
    """
    if not encrypted_str:
        return None

    fernet = get_fernet()

    if not fernet:
        # Fallback: try to parse as plain JSON
        try:
            return json.loads(encrypted_str)
        except json.JSONDecodeError:
            logger.error("Failed to parse credentials (no encryption key available)")
            return None

    try:
        decrypted = fernet.decrypt(encrypted_str.encode())
        return json.loads(decrypted.decode())
    except InvalidToken:
        # Try parsing as plain JSON (migration from old format)
        try:
            return json.loads(encrypted_str)
        except json.JSONDecodeError:
            logger.error("Failed to decrypt credentials: invalid token and not valid JSON")
            return None
    except Exception as e:
        logger.error(f"Failed to decrypt credentials: {e}")
        return None
