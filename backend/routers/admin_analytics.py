from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any
import csv
import io
from storage.data_store import data_store
from services.auth_utils import get_user_from_token

# Create new router for analytics
router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])

def verify_admin_access(authorization: Optional[str] = Header(None)):
    """
    Dependency to verify admin access.
    Duplicate of logic in admin.py to ensure isolation and valid imports.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    # Allow demo token
    if token == "admin-demo-token-2024" or token == "demo-token":
        return {"role": "admin", "user_id": "admin"}
    
    user = get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
        
    return user

@router.get("/summary")
async def get_summary(admin: Dict[str, Any] = Depends(verify_admin_access)):
    """Get high-level summary counts"""
    grievances = data_store.get_all_grievances()
    total = len(grievances)
    
    # Calculate counts
    resolved = sum(1 for g in grievances if g.status.value == "resolved")
    in_progress = sum(1 for g in grievances if g.status.value == "in_progress")
    # Pending is everything not resolved
    pending = total - resolved
    
    return {
        "total_complaints": total,
        "pending": pending,
        "resolved": resolved,
        "in_progress": in_progress
    }

@router.get("/by-department")
async def get_by_department(admin: Dict[str, Any] = Depends(verify_admin_access)):
    """Get complaints count by department"""
    grievances = data_store.get_all_grievances()
    dept_counts = {}
    
    for g in grievances:
        dept = g.department
        if not dept:
            dept = "Unassigned"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
    return dept_counts

@router.get("/export")
async def export_complaints(admin: Dict[str, Any] = Depends(verify_admin_access)):
    """Export all complaints as CSV"""
    grievances = data_store.get_all_grievances()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Complaint ID", "Category", "Description", "Location", 
        "Status", "Priority", "Department", "Created Date", 
        "Submitter Name", "Submitter Phone"
    ])
    
    # Rows
    for g in grievances:
        writer.writerow([
            g.id,
            g.category.value,
            g.description,
            g.location,
            g.status.value,
            g.priority.value,
            g.department,
            g.created_at,
            g.submitter_name,
            g.submitter_phone or "N/A"
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=complaints_export.csv"
        }
    )
