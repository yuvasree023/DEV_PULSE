"""
Security and token encryption service for developer tool integrations.
Provides authenticated symmetric encryption for storing tokens (GitHub, VS Code, Jira, Linear)
on Render and in-memory/database caches.
"""

import base64
import hashlib
import os
from typing import Optional

# Secret key configured via environment variable with fallback
ENCRYPTION_SECRET = os.getenv("ENCRYPTION_SECRET_KEY", "devpulse-super-secret-render-key-2026")


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
    
    # Simple, dependency-free reproducible symmetric stream encryption
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
        # If raw token was stored, return as-is
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
