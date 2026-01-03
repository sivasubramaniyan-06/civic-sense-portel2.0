"""
Mock Authentication Routes
"""
from fastapi import APIRouter
from models.schemas import AdminLoginRequest, AdminLoginResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Mock credentials for demo
MOCK_CREDENTIALS = {
    "admin": "admin123",
    "officer": "officer123"
}

MOCK_TOKEN = "admin-demo-token-2024"


@router.post("/login", response_model=AdminLoginResponse)
async def login(request: AdminLoginRequest):
    """
    Mock login for admin/officer.
    In production, this would use proper authentication.
    """
    if request.username in MOCK_CREDENTIALS:
        if MOCK_CREDENTIALS[request.username] == request.password:
            return AdminLoginResponse(
                success=True,
                token=MOCK_TOKEN,
                message="Login successful. Welcome to Admin Dashboard."
            )
    
    return AdminLoginResponse(
        success=False,
        token=None,
        message="Invalid credentials. Please check username and password."
    )


@router.post("/logout")
async def logout():
    """
    Mock logout.
    """
    return {"success": True, "message": "Logged out successfully."}
