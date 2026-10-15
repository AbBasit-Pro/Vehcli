"""
Authentication Routes for AutoDamage AI Pakistan.
Provides endpoints for user registration, login, password management, and inspection history.
"""

import os
import datetime
import secrets
import re
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
from bson import ObjectId
from pymongo.errors import PyMongoError

from backend.database.mongodb import users_collection, inspections_collection, get_db
from backend.auth.auth_handler import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    get_user_from_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ==========================================
# Database Connection Helpers
# ==========================================

def get_active_users_collection():
    """Retrieve users collection or raise helpful 503 if MongoDB is not connected."""
    from backend.database.mongodb import users_collection as col
    if col is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection is not configured or unavailable. Please configure MONGODB_URI in .env."
        )
    return col


def get_active_inspections_collection():
    """Retrieve inspections collection or raise helpful 503 if MongoDB is not connected."""
    from backend.database.mongodb import inspections_collection as col
    if col is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection is not configured or unavailable. Please configure MONGODB_URI in .env."
        )
    return col


# ==========================================
# Pydantic v2 Request Models
# ==========================================

class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 3:
            raise ValueError("Full name must be at least 3 characters long")
        return clean

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 3 or len(clean) > 20:
            raise ValueError("Username must be between 3 and 20 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", clean):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class InspectionSaveRequest(BaseModel):
    vehicle: Optional[Dict[str, Any]] = None
    detections: Optional[List[Dict[str, Any]]] = []
    internal_damages: Optional[List[Dict[str, Any]]] = []
    overall_severity: Optional[str] = "Moderate"
    total_damages: Optional[int] = 0
    city: Optional[str] = "Rawalpindi"
    consensus_estimate: Optional[Dict[str, Any]] = None
    annotated_image_base64: Optional[str] = None
    image_filename: Optional[str] = None


# ==========================================
# Authentication Dependency
# ==========================================

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Dependency to extract and validate current authenticated user from JWT token."""
    token = None
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email") or payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    users_col = get_active_users_collection()
    try:
        user = users_col.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User associated with token not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=403,
                detail="User account is deactivated"
            )
        return user
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error while authenticating user: {str(pe)}. Please check MONGODB_URI in .env."
        )


# ==========================================
# Auth Endpoints
# ==========================================

@router.post("/register")
def register_user(req: RegisterRequest):
    """Register a new user account."""
    users_col = get_active_users_collection()
    norm_email = str(req.email).strip().lower()
    norm_username = req.username.strip()

    try:
        # Check if email already registered
        if users_col.find_one({"email": norm_email}):
            raise HTTPException(
                status_code=400,
                detail="Email is already registered"
            )

        # Check if username already taken
        if users_col.find_one({"username": norm_username}):
            raise HTTPException(
                status_code=400,
                detail="Username is already taken"
            )

        new_user = {
            "full_name": req.full_name.strip(),
            "username": norm_username,
            "email": norm_email,
            "password_hash": hash_password(req.password),
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "is_active": True,
            "reset_token": None,
            "reset_token_expires": None,
            "last_login": None,
        }

        res = users_col.insert_one(new_user)
        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": str(res.inserted_id),
                "full_name": new_user["full_name"],
                "username": new_user["username"],
                "email": new_user["email"],
            }
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error during registration: {str(pe)}. Please check MONGODB_URI in .env."
        )


@router.post("/login")
def login_user(req: LoginRequest):
    """Authenticate user with email and password and return JWT access token."""
    users_col = get_active_users_collection()
    norm_email = str(req.email).strip().lower()

    try:
        user = users_col.find_one({"email": norm_email})
        if not user or not verify_password(req.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=403,
                detail="User account is deactivated"
            )

        token = create_access_token({
            "sub": user["email"],
            "email": user["email"],
            "username": user.get("username", ""),
            "user_id": str(user["_id"])
        })

        users_col.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.datetime.now(datetime.timezone.utc)}}
        )

        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "full_name": user.get("full_name", ""),
                "username": user.get("username", ""),
                "email": user.get("email", ""),
            }
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error during login: {str(pe)}. Please check MONGODB_URI in .env."
        )


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """Generate password reset token for account recovery."""
    users_col = get_active_users_collection()
    norm_email = str(req.email).strip().lower()

    try:
        user = users_col.find_one({"email": norm_email})
        if not user:
            raise HTTPException(
                status_code=404,
                detail="No account found with this email address"
            )

        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)

        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_token": reset_token,
                    "reset_token_expires": reset_expires
                }
            }
        )

        return {
            "success": True,
            "message": "Password reset token generated",
            "reset_token": reset_token
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error during password reset request: {str(pe)}. Please check MONGODB_URI in .env."
        )


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    """Reset password using a valid reset token."""
    users_col = get_active_users_collection()

    try:
        user = users_col.find_one({"reset_token": req.token})
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )

        expires_at = user.get("reset_token_expires")
        if not expires_at:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )

        if isinstance(expires_at, datetime.datetime):
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
            if datetime.datetime.now(datetime.timezone.utc) > expires_at:
                raise HTTPException(
                    status_code=400,
                    detail="Reset token has expired"
                )

        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": hash_password(req.new_password),
                    "reset_token": None,
                    "reset_token_expires": None,
                }
            }
        )

        return {
            "success": True,
            "message": "Password reset successfully"
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error during password reset: {str(pe)}. Please check MONGODB_URI in .env."
        )


@router.get("/me")
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve details of currently logged-in user."""
    created_at = current_user.get("created_at")
    last_login = current_user.get("last_login")

    return {
        "success": True,
        "user": {
            "id": str(current_user["_id"]),
            "full_name": current_user.get("full_name", ""),
            "username": current_user.get("username", ""),
            "email": current_user.get("email", ""),
            "created_at": created_at.isoformat() if isinstance(created_at, datetime.datetime) else created_at,
            "last_login": last_login.isoformat() if isinstance(last_login, datetime.datetime) else last_login,
            "is_active": current_user.get("is_active", True),
        }
    }


@router.post("/save-inspection")
def save_inspection(
    req: InspectionSaveRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Save an inspection assessment to MongoDB associated with authenticated user."""
    inspections_col = get_active_inspections_collection()

    try:
        doc = req.model_dump()
        doc["user_id"] = str(current_user["_id"])
        doc["user_email"] = current_user.get("email", "")
        doc["created_at"] = datetime.datetime.now(datetime.timezone.utc)

        res = inspections_col.insert_one(doc)
        return {
            "success": True,
            "inspection_id": str(res.inserted_id)
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error saving inspection: {str(pe)}. Please check MONGODB_URI in .env."
        )


@router.get("/my-inspections")
def get_my_inspections(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieve the authenticated user's last 20 inspections (excluding heavy base64 image)."""
    inspections_col = get_active_inspections_collection()

    try:
        cursor = (
            inspections_col.find(
                {"user_id": str(current_user["_id"])},
                {"annotated_image_base64": 0}
            )
            .sort("created_at", -1)
            .limit(20)
        )

        inspections = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            if isinstance(doc.get("created_at"), datetime.datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            inspections.append(doc)

        return {
            "success": True,
            "count": len(inspections),
            "inspections": inspections
        }
    except HTTPException:
        raise
    except PyMongoError as pe:
        raise HTTPException(
            status_code=503,
            detail=f"Database error fetching inspections: {str(pe)}. Please check MONGODB_URI in .env."
        )
