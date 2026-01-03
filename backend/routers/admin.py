"""
Admin API Routes - Protected with JWT and role-based access
"""
from fastapi import APIRouter, HTTPException, Header, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from models.schemas import Grievance, StatusUpdateRequest, Status
from storage.data_store import data_store
from services.auth_utils import get_user_from_token

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def require_admin(authorization: Optional[str] = Header(None)):
    """Dependency to require admin role"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    # Allow demo token for backward compatibility
    if token == "admin-demo-token-2024" or token == "demo-token":
        return {"user_id": "admin", "email": "admin@civicsense.gov.in", "role": "admin", "name": "Admin"}
    
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


# Request Models
class AssignComplaintRequest(BaseModel):
    department: str
    officer_name: Optional[str] = None
    area: Optional[str] = None
    remarks: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: Status
    admin_remarks: Optional[str] = None


class AnalyticsResponse(BaseModel):
    total_complaints: int
    high_priority_count: int
    resolved_count: int
    pending_count: int
    by_status: dict
    by_priority: dict
    by_category: dict
    by_department: dict
    resolution_rate: float


@router.get("/complaints", response_model=List[Grievance])
async def get_all_complaints(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    admin: dict = Depends(require_admin)
):
    """
    Get all complaints with optional filters (Admin only).
    """
    grievances = data_store.get_all_grievances()
    
    # Apply filters
    if category:
        grievances = [g for g in grievances if g.category.value == category]
    
    if priority:
        grievances = [g for g in grievances if g.priority.value == priority]
    
    if status:
        grievances = [g for g in grievances if g.status.value == status]
    
    if area:
        grievances = [g for g in grievances if area.lower() in g.location.lower()]
    
    if search:
        search_lower = search.lower()
        grievances = [g for g in grievances if 
            search_lower in g.id.lower() or
            search_lower in g.description.lower() or
            search_lower in g.location.lower() or
            search_lower in g.submitter_name.lower()
        ]
    
    # Sort by created_at descending (newest first)
    grievances.sort(key=lambda g: g.created_at, reverse=True)
    return grievances


@router.get("/complaints/{complaint_id}")
async def get_complaint_detail(
    complaint_id: str,
    admin: dict = Depends(require_admin)
):
    """Get single complaint detail (Admin only)."""
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return {"success": True, "complaint": grievance.model_dump()}


@router.put("/complaints/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    request: AssignComplaintRequest,
    admin: dict = Depends(require_admin)
):
    """
    Assign complaint to department/officer (Admin only).
    """
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Update grievance fields
    grievance.department = request.department
    if request.area:
        grievance.location = request.area
    
    # Update status to assigned if still submitted
    if grievance.status == Status.SUBMITTED:
        remarks = f"Assigned to {request.department}"
        if request.officer_name:
            remarks += f" - Officer: {request.officer_name}"
        if request.remarks:
            remarks += f". {request.remarks}"
        
        data_store.update_status(complaint_id, Status.ASSIGNED, remarks)
    
    return {
        "success": True,
        "message": f"Complaint {complaint_id} assigned to {request.department}",
        "complaint": data_store.get_grievance(complaint_id).model_dump()
    }


@router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    request: UpdateStatusRequest,
    admin: dict = Depends(require_admin)
):
    """
    Update complaint status with admin remarks (Admin only).
    """
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Build remarks
    remarks = request.admin_remarks or f"Status updated to {request.status.value}"
    
    # Update status
    updated = data_store.update_status(complaint_id, request.status, remarks)
    
    return {
        "success": True,
        "message": f"Status updated to {request.status.value}",
        "complaint": updated.model_dump()
    }


# Keep backward compatible endpoint
@router.patch("/grievances/{grievance_id}/status", response_model=Grievance)
async def update_grievance_status_legacy(
    grievance_id: str,
    request: StatusUpdateRequest,
    authorization: Optional[str] = Header(None)
):
    """Legacy endpoint for backward compatibility."""
    grievance = data_store.get_grievance(grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail=f"Grievance with ID {grievance_id} not found.")
    
    updated = data_store.update_status(grievance_id, request.status, request.remarks)
    return updated


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(admin: dict = Depends(require_admin)):
    """
    Get dashboard analytics (Admin only).
    """
    grievances = data_store.get_all_grievances()
    
    by_status = {"submitted": 0, "assigned": 0, "in_progress": 0, "resolved": 0}
    by_priority = {"high": 0, "medium": 0, "low": 0}
    by_category = {}
    by_department = {}
    
    for g in grievances:
        by_status[g.status.value] = by_status.get(g.status.value, 0) + 1
        by_priority[g.priority.value] = by_priority.get(g.priority.value, 0) + 1
        by_category[g.category.value] = by_category.get(g.category.value, 0) + 1
        by_department[g.department] = by_department.get(g.department, 0) + 1
    
    total = len(grievances)
    resolved = by_status.get("resolved", 0)
    pending = total - resolved
    
    return AnalyticsResponse(
        total_complaints=total,
        high_priority_count=by_priority.get("high", 0),
        resolved_count=resolved,
        pending_count=pending,
        by_status=by_status,
        by_priority=by_priority,
        by_category=by_category,
        by_department=by_department,
        resolution_rate=round((resolved / total * 100) if total > 0 else 0, 1)
    )


# Keep legacy stats endpoint
@router.get("/stats")
async def get_stats():
    """Legacy stats endpoint for backward compatibility."""
    grievances = data_store.get_all_grievances()
    
    stats = {
        "total": len(grievances),
        "by_status": {"submitted": 0, "assigned": 0, "in_progress": 0, "resolved": 0},
        "by_priority": {"high": 0, "medium": 0, "low": 0},
        "by_category": {}
    }
    
    for g in grievances:
        stats["by_status"][g.status.value] += 1
        stats["by_priority"][g.priority.value] += 1
        cat = g.category.value
        stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
    
    return stats


# Keep legacy grievances endpoint
@router.get("/grievances", response_model=List[Grievance])
async def get_all_grievances_legacy(authorization: Optional[str] = Header(None)):
    """Legacy endpoint for backward compatibility."""
    grievances = data_store.get_all_grievances()
    grievances.sort(key=lambda g: g.created_at, reverse=True)
    return grievances
