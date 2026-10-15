"""
Authentication Helper Module for AutoDamage AI Pakistan.
Handles password hashing, verification, and JWT generation & decoding.
"""

import os
import datetime
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "autodamage-ai-pak-secret-2026-xyz")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Passlib 1.7.4 compatibility with modern bcrypt
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        setattr(bcrypt, "__about__", type("_About", (), {"__version__": getattr(bcrypt, "__version__", "4.3.0")}))
except Exception:
    pass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash raw password with bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify raw password against bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create JWT access token with 7-day expiration by default."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token, returning its payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_from_token(token: str, users_col) -> Optional[Dict[str, Any]]:
    """Look up a user from database using decoded JWT token."""
    payload = decode_token(token)
    if not payload:
        return None
    
    email = payload.get("email") or payload.get("sub")
    if not email or users_col is None:
        return None
    
    try:
        user = users_col.find_one({"email": email})
        return user
    except Exception as e:
        print(f"[WARNING] Error fetching user from token: {e}")
        return None
