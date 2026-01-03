"""
User Routes - Protected endpoints for citizen dashboard
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, List
from pydantic import BaseModel

from storage.data_store import data_store
from models.schemas import Grievance
from services.auth_utils import get_user_from_token

router = APIRouter(prefix="/api/user", tags=["User Dashboard"])


def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user


class UserComplaintSummary(BaseModel):
    """Summary of user complaint for dashboard"""
    id: str
    category: str
    description: str
    location: str
    priority: str
    status: str
    department: str
    created_at: str
    has_image: bool


class UserComplaintsResponse(BaseModel):
    """Response for user complaints list"""
    success: bool
    complaints: List[UserComplaintSummary]
    total: int


@router.get("/complaints", response_model=UserComplaintsResponse)
async def get_user_complaints(user: dict = Depends(get_current_user)):
    """Get all complaints submitted by the logged-in user"""
    user_id = user.get("user_id")
    
    # Get user's grievances
    grievances = data_store.get_user_grievances(user_id)
    
    # Also check by email if user_id not found (for backward compatibility)
    if not grievances and user.get("email"):
        all_grievances = data_store.get_all_grievances()
        grievances = [g for g in all_grievances if g.submitter_email == user.get("email")]
    
    # Convert to summary format
    complaints = [
        UserComplaintSummary(
            id=g.id,
            category=g.category.value,
            description=g.description[:100] + "..." if len(g.description) > 100 else g.description,
            location=g.location,
            priority=g.priority.value,
            status=g.status.value,
            department=g.department,
            created_at=g.created_at,
            has_image=bool(g.image_data or g.image_path)
        )
        for g in sorted(grievances, key=lambda x: x.created_at, reverse=True)
    ]
    
    return UserComplaintsResponse(
        success=True,
        complaints=complaints,
        total=len(complaints)
    )


@router.get("/complaints/{complaint_id}")
async def get_complaint_detail(complaint_id: str, user: dict = Depends(get_current_user)):
    """Get detailed view of a specific complaint"""
    grievance = data_store.get_grievance(complaint_id)
    
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Verify ownership (user can view their own complaints or if they're admin)
    user_id = user.get("user_id")
    user_email = user.get("email")
    user_role = user.get("role")
    
    is_owner = (grievance.user_id == user_id) or (grievance.submitter_email == user_email)
    is_admin = user_role == "admin"
    
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "success": True,
        "complaint": grievance.model_dump()
    }


@router.get("/profile")
async def get_user_profile(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "success": True,
        "user": user
    }
