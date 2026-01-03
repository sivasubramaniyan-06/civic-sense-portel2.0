"""
Admin API Routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional

from models.schemas import Grievance, StatusUpdateRequest, Status
from storage.data_store import data_store

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Mock admin token for demo
MOCK_ADMIN_TOKEN = "admin-demo-token-2024"


def verify_admin_token(authorization: Optional[str] = Header(None)) -> bool:
    """Simple mock token verification"""
    if not authorization:
        return False
    # Accept the mock token or "Bearer {token}" format
    token = authorization.replace("Bearer ", "")
    return token == MOCK_ADMIN_TOKEN


@router.get("/grievances", response_model=List[Grievance])
async def get_all_grievances(authorization: Optional[str] = Header(None)):
    """
    Get all grievances for admin dashboard.
    """
    # For demo, allow access without strict auth
    grievances = data_store.get_all_grievances()
    # Sort by created_at descending (newest first)
    grievances.sort(key=lambda g: g.created_at, reverse=True)
    return grievances


@router.patch("/grievances/{grievance_id}/status", response_model=Grievance)
async def update_grievance_status(
    grievance_id: str,
    request: StatusUpdateRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Update grievance status (admin only).
    """
    grievance = data_store.get_grievance(grievance_id)
    if not grievance:
        raise HTTPException(
            status_code=404,
            detail=f"Grievance with ID {grievance_id} not found."
        )
    
    updated = data_store.update_status(
        grievance_id,
        request.status,
        request.remarks
    )
    
    return updated


@router.get("/stats")
async def get_stats():
    """
    Get dashboard statistics.
    """
    grievances = data_store.get_all_grievances()
    
    stats = {
        "total": len(grievances),
        "by_status": {
            "submitted": 0,
            "assigned": 0,
            "in_progress": 0,
            "resolved": 0
        },
        "by_priority": {
            "high": 0,
            "medium": 0,
            "low": 0
        },
        "by_category": {}
    }
    
    for g in grievances:
        stats["by_status"][g.status.value] += 1
        stats["by_priority"][g.priority.value] += 1
        cat = g.category.value
        stats["by_category"][cat] = stats["by_category"].get(cat, 0) + 1
    
    return stats
