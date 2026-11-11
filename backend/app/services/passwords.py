"""
Password hashing and validation for email/password accounts.
Uses PBKDF2-HMAC-SHA256 from the standard library (no new dependency).
"""

import base64
import hashlib
import hmac
import os

ITERATIONS = 240_000
_ALGO = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    """Returns a self-describing salted PBKDF2 hash string."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS)
    return f"{_ALGO}${ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verification of a password against a stored hash."""
    if not password or not stored:
        return False
    try:
        algo, iters, salt_b64, hash_b64 = stored.split("$")
        if algo != _ALGO:
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iters))
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def validate_password_strength(password: str) -> str:
    """Returns an error message, or an empty string when acceptable."""
    if not password or len(password) < 8:
        return "Password must be at least 8 characters."
    if len(password) > 256:
        return "Password is too long."
    return ""
