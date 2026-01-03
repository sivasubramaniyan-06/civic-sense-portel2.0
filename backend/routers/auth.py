"""
JWT Authentication Routes
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth_utils import hash_password, verify_password, create_access_token, get_user_from_token
from storage.user_store import get_user_by_email, create_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[dict] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

# Legacy admin login support (for existing admin dashboard)
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register a new user"""
    try:
        # Check if user exists
        existing = get_user_by_email(request.email)
        if existing:
            return AuthResponse(
                success=False,
                message="Email already registered"
            )
        
        # Validate password
        if len(request.password) < 6:
            return AuthResponse(
                success=False,
                message="Password must be at least 6 characters"
            )
        
        # Create user
        hashed = hash_password(request.password)
        user = create_user(request.email, hashed, request.name, "user")
        
        # Create token
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"]
        })
        
        return AuthResponse(
            success=True,
            message="Registration successful",
            token=token,
            user={
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        )
    except Exception as e:
        return AuthResponse(
            success=False,
            message=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    try:
        user = get_user_by_email(request.email)
        
        if not user:
            return AuthResponse(
                success=False,
                message="Invalid email or password"
            )
        
        if not verify_password(request.password, user["password"]):
            return AuthResponse(
                success=False,
                message="Invalid email or password"
            )
        
        # Create token
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"]
        })
        
        return AuthResponse(
            success=True,
            message="Login successful",
            token=token,
            user={
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        )
    except Exception as e:
        return AuthResponse(
            success=False,
            message=f"Login failed: {str(e)}"
        )


# Legacy endpoint for existing admin dashboard compatibility
@router.post("/admin-login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """Legacy admin login (username/password)"""
    # Map username to email for backward compatibility
    email_map = {
        "admin": "admin@civicsense.gov.in",
        "officer": "admin@civicsense.gov.in"
    }
    
    email = email_map.get(request.username, request.username)
    user = get_user_by_email(email)
    
    if user and verify_password(request.password, user["password"]):
        token = create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"]
        })
        return AdminLoginResponse(
            success=True,
            message="Login successful",
            token=token
        )
    
    # Fallback to mock credentials for demo
    MOCK_CREDENTIALS = {"admin": "admin123", "officer": "officer123"}
    if request.username in MOCK_CREDENTIALS and MOCK_CREDENTIALS[request.username] == request.password:
        return AdminLoginResponse(
            success=True,
            message="Login successful (demo mode)",
            token="demo-token"
        )
    
    return AdminLoginResponse(
        success=False,
        message="Invalid credentials"
    )


@router.get("/me", response_model=AuthResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current logged-in user from token"""
    if not authorization:
        return AuthResponse(success=False, message="No authorization header")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    user_data = get_user_from_token(token)
    if user_data:
        return AuthResponse(
            success=True,
            message="User authenticated",
            user=user_data
        )
    
    return AuthResponse(success=False, message="Invalid or expired token")


@router.post("/logout")
async def logout():
    """Logout (client should remove token)"""
    return {"success": True, "message": "Logged out successfully"}
