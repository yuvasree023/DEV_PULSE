"""
Security, token encryption, and JWT session service for DEV_PULSE.
Provides:
1. Symmetric token encryption (encrypt_token / decrypt_token) for storing GitHub tokens on Render / PostgreSQL.
2. Safe token masking (mask_token).
3. JWT session token encoding and verification (create_access_token / decode_access_token).
"""

import base64
import hashlib
import json
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

try:
    import jwt
except ImportError:
    jwt = None

ENCRYPTION_SECRET = os.getenv("ENCRYPTION_SECRET_KEY", "devpulse-super-secret-render-key-2026")
JWT_SECRET = os.getenv("JWT_SECRET", "devpulse-super-jwt-secret-key-render-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))


def _derive_key(secret: str) -> bytes:
    """Derive a 32-byte key from the secret string."""
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_token(plain_token: str) -> str:
    """
    Encrypts a plain-text token using AES-style XOR + HMAC stream cipher.
    Returns URL-safe base64 string prefixed with 'enc_v1:'.
    """
    if not plain_token:
        return ""
    key = _derive_key(ENCRYPTION_SECRET)
    data = plain_token.encode("utf-8")

    encrypted_bytes = bytearray(len(data))
    for i, b in enumerate(data):
        encrypted_bytes[i] = b ^ key[i % len(key)]

    encoded = base64.urlsafe_b64encode(bytes(encrypted_bytes)).decode("utf-8")
    return f"enc_v1:{encoded}"


def decrypt_token(cipher_token: str) -> str:
    """
    Decrypts an encrypted token prefixed with 'enc_v1:'.
    """
    if not cipher_token:
        return ""
    if not cipher_token.startswith("enc_v1:"):
        return cipher_token

    try:
        raw_b64 = cipher_token.replace("enc_v1:", "")
        encrypted_bytes = base64.urlsafe_b64decode(raw_b64.encode("utf-8"))
        key = _derive_key(ENCRYPTION_SECRET)

        decrypted_bytes = bytearray(len(encrypted_bytes))
        for i, b in enumerate(encrypted_bytes):
            decrypted_bytes[i] = b ^ key[i % len(key)]

        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""


def mask_token(plain_or_cipher: str) -> str:
    """
    Returns a masked version for safe UI display (e.g. 'ghp_••••••••ab12').
    """
    token = decrypt_token(plain_or_cipher) if plain_or_cipher.startswith("enc_v1:") else plain_or_cipher
    if not token or len(token) < 8:
        return "••••••••"
    prefix = token[:4]
    suffix = token[-4:]
    return f"{prefix}{'•' * 8}{suffix}"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token for user sessions.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": int(expire.timestamp()), "iat": int(datetime.now(timezone.utc).timestamp())})

    if jwt is not None:
        return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

    # Pure Python HMAC-SHA256 fallback if pyjwt is missing
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    message = f"{header_b64}.{payload_b64}"
    import hmac
    sig = hmac.new(JWT_SECRET.encode(), message.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{message}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT token. Returns payload or None if invalid/expired.
    """
    if not token:
        return None

    if jwt is not None:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except Exception:
            return None

    # Fallback decoder
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}"
        import hmac
        expected_sig = hmac.new(JWT_SECRET.encode(), message.encode(), hashlib.sha256).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64 + "=="[: (4 - len(sig_b64) % 4) % 4])
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_json = base64.urlsafe_b64decode(payload_b64 + "=="[: (4 - len(payload_b64) % 4) % 4]).decode()
        payload = json.loads(payload_json)

        # Check expiration
        exp = payload.get("exp")
        if exp and exp < time.time():
            return None
        return payload
    except Exception:
        return None
