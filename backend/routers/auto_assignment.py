"""
Auto Assignment API Routes - Admin endpoints for AI-assisted grievance assignment
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from models.schemas import Status
from models.auto_assignment_schemas import (
    AutoAssignmentStatus,
    AutoAssignmentData,
    AutoAssignmentAuditLog,
    AutoAssignmentQueueItem,
    AutoAssignmentQueueResponse,
    AutoAssignmentConfig,
    ApproveAssignmentRequest,
    RejectAssignmentRequest,
    BulkAssignmentRequest
)
from storage.data_store import data_store
from storage.auto_assignment_store import auto_assignment_store
from services.auto_categorizer import get_all_departments, analyze_grievance_for_auto_assignment
from routers.admin import require_admin

router = APIRouter(prefix="/api/admin/auto-assignment", tags=["Auto Assignment"])


def sync_complaints_to_queue():
    """
    Synchronize all SUBMITTED complaints to the auto-assignment queue.
    Analyzes complaints that don't have auto-assignment data yet.
    This ensures existing complaints appear in the Auto Assign page.
    """
    all_grievances = data_store.get_all_grievances()
    synced_count = 0
    
    for grievance in all_grievances:
        # Only process SUBMITTED complaints that are not yet assigned
        if grievance.status != Status.SUBMITTED:
            continue
        
        # Skip if already has auto-assignment data
        if grievance.id in auto_assignment_store.assignments:
            continue
        
        # Analyze and create auto-assignment data
        try:
            auto_category, suggested_dept, confidence = analyze_grievance_for_auto_assignment(
                grievance.description,
                grievance.category
            )
            
            auto_data = AutoAssignmentData(
                auto_category=auto_category,
                suggested_department=suggested_dept,
                confidence_score=confidence,
                auto_status=AutoAssignmentStatus.PENDING_APPROVAL,
                analyzed_at=datetime.now().isoformat(),
                keywords_matched=grievance.keywords_found
            )
            auto_assignment_store.create_auto_assignment(grievance.id, auto_data)
            synced_count += 1
        except Exception as e:
            print(f"Warning: Failed to analyze grievance {grievance.id}: {e}")
    
    return synced_count


class AutoAssignmentStatsResponse(BaseModel):
    """Statistics about auto-assignments"""
    total: int
    pending: int
    approved: int
    rejected: int
    review_required: int
    average_confidence: float


@router.get("/queue", response_model=AutoAssignmentQueueResponse)
async def get_auto_assignment_queue(
    days: Optional[int] = Query(None, description="Filter by days since submission"),
    status: Optional[str] = Query(None, description="Filter by auto status"),
    min_confidence: Optional[float] = Query(None, ge=0, le=100),
    max_confidence: Optional[float] = Query(None, ge=0, le=100),
    department: Optional[str] = Query(None),
    admin: dict = Depends(require_admin)
):
    """
    Get the auto-assignment queue with optional filters.
    Returns grievances that have been auto-categorized and are pending admin review.
    Automatically syncs any new SUBMITTED complaints to the queue.
    """
    # SYNC: Automatically analyze any SUBMITTED complaints not yet in queue
    sync_complaints_to_queue()
    
    # Get config for default days filter
    config = auto_assignment_store.get_config()
    filter_days = days if days is not None else config.review_window_days
    
    # Get all grievances
    all_grievances = data_store.get_all_grievances()
    
    # Get all auto-assignment data
    all_assignments = auto_assignment_store.assignments
    
    queue_items = []
    pending_count = 0
    approved_count = 0
    rejected_count = 0
    
    now = datetime.now()
    cutoff_date = now - timedelta(days=filter_days)
    
    for grievance in all_grievances:
        # Check if this grievance has auto-assignment data
        if grievance.id not in all_assignments:
            continue
        
        auto_data = all_assignments[grievance.id]
        
        # Apply filters
        
        # Status filter
        if status:
            if auto_data.auto_status.value != status:
                continue
        
        # Days filter
        grievance_date = datetime.fromisoformat(grievance.created_at.replace('Z', '+00:00').replace('+00:00', ''))
        if grievance_date < cutoff_date:
            continue
        
        # Confidence filter
        if min_confidence is not None and auto_data.confidence_score < min_confidence:
            continue
        if max_confidence is not None and auto_data.confidence_score > max_confidence:
            continue
        
        # Department filter
        if department and auto_data.suggested_department != department:
            continue
        
        # Calculate days since submission
        days_since = (now - grievance_date).days
        
        # Count by status
        if auto_data.auto_status == AutoAssignmentStatus.PENDING_APPROVAL:
            pending_count += 1
        elif auto_data.auto_status == AutoAssignmentStatus.APPROVED:
            approved_count += 1
        elif auto_data.auto_status == AutoAssignmentStatus.REJECTED:
            rejected_count += 1
        
        # Build queue item
        queue_item = AutoAssignmentQueueItem(
            complaint_id=grievance.id,
            complaint_summary=grievance.description[:200] + "..." if len(grievance.description) > 200 else grievance.description,
            location=grievance.location,
            nlp_category=auto_data.auto_category.value,
            suggested_department=auto_data.suggested_department,
            confidence_score=auto_data.confidence_score,
            days_since_submission=days_since,
            current_status=auto_data.auto_status.value,
            priority=grievance.priority.value,
            created_at=grievance.created_at,
            keywords_found=auto_data.keywords_matched
        )
        queue_items.append(queue_item)
    
    # Sort by days (oldest first) and then by confidence
    queue_items.sort(key=lambda x: (-x.days_since_submission, -x.confidence_score))
    
    return AutoAssignmentQueueResponse(
        success=True,
        items=queue_items,
        total=len(queue_items),
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count
    )


@router.get("/stats", response_model=AutoAssignmentStatsResponse)
async def get_auto_assignment_stats(admin: dict = Depends(require_admin)):
    """Get statistics about auto-assignments"""
    # Sync first to ensure accurate stats
    sync_complaints_to_queue()
    stats = auto_assignment_store.get_stats()
    return AutoAssignmentStatsResponse(**stats)


@router.post("/sync")
async def manual_sync(admin: dict = Depends(require_admin)):
    """
    Manually trigger synchronization of SUBMITTED complaints to the auto-assignment queue.
    Analyzes all complaints that don't have auto-assignment data yet.
    """
    synced_count = sync_complaints_to_queue()
    return {
        "success": True,
        "message": f"Synchronized {synced_count} new complaints to the auto-assignment queue",
        "synced_count": synced_count
    }


@router.get("/departments")
async def get_departments(admin: dict = Depends(require_admin)):
    """Get list of all available departments for assignment"""
    return {"departments": get_all_departments()}


@router.get("/config", response_model=AutoAssignmentConfig)
async def get_config(admin: dict = Depends(require_admin)):
    """Get current auto-assignment configuration"""
    return auto_assignment_store.get_config()


@router.put("/config", response_model=AutoAssignmentConfig)
async def update_config(
    config: AutoAssignmentConfig,
    admin: dict = Depends(require_admin)
):
    """Update auto-assignment configuration"""
    return auto_assignment_store.update_config(config)


@router.put("/{complaint_id}/approve")
async def approve_assignment(
    complaint_id: str,
    request: ApproveAssignmentRequest,
    admin: dict = Depends(require_admin)
):
    """
    Approve auto-assignment for a grievance.
    This will:
    1. Update auto-assignment status to APPROVED
    2. Assign the grievance to the specified department
    3. Update grievance status to ASSIGNED
    4. Log the decision for audit
    """
    # Get grievance
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Get auto-assignment data
    auto_data = auto_assignment_store.get_auto_assignment(complaint_id)
    if not auto_data:
        raise HTTPException(status_code=404, detail="No auto-assignment data found for this complaint")
    
    if auto_data.auto_status != AutoAssignmentStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot approve: current status is {auto_data.auto_status.value}"
        )
    
    # Update auto-assignment status
    auto_assignment_store.update_auto_status(complaint_id, AutoAssignmentStatus.APPROVED)
    
    # Update grievance department and status
    grievance.department = request.department
    grievance.status = Status.ASSIGNED
    grievance.updated_at = datetime.now().isoformat()
    
    # Add timeline entry
    remarks = f"Auto-assigned to {request.department} (AI confidence: {auto_data.confidence_score}%)"
    if request.remarks:
        remarks += f". Admin notes: {request.remarks}"
    
    data_store.update_status(complaint_id, Status.ASSIGNED, remarks)
    
    # Create audit log
    audit_log = AutoAssignmentAuditLog(
        grievance_id=complaint_id,
        action="approved",
        admin_id=admin.get("user_id", "unknown"),
        admin_name=admin.get("name", admin.get("email", "Admin")),
        timestamp=datetime.now().isoformat(),
        nlp_suggestion=auto_data.suggested_department,
        final_department=request.department,
        confidence_score=auto_data.confidence_score,
        remarks=request.remarks
    )
    auto_assignment_store.add_audit_log(audit_log)
    
    return {
        "success": True,
        "message": f"Complaint {complaint_id} approved and assigned to {request.department}",
        "complaint": data_store.get_grievance(complaint_id).model_dump()
    }


@router.put("/{complaint_id}/reject")
async def reject_assignment(
    complaint_id: str,
    request: RejectAssignmentRequest,
    admin: dict = Depends(require_admin)
):
    """
    Reject auto-assignment suggestion.
    This will:
    1. Update auto-assignment status to REVIEW_REQUIRED
    2. Keep grievance unassigned for manual review
    3. Log the decision for audit
    """
    # Get grievance
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Get auto-assignment data
    auto_data = auto_assignment_store.get_auto_assignment(complaint_id)
    if not auto_data:
        raise HTTPException(status_code=404, detail="No auto-assignment data found for this complaint")
    
    if auto_data.auto_status != AutoAssignmentStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject: current status is {auto_data.auto_status.value}"
        )
    
    # Update auto-assignment status
    auto_assignment_store.update_auto_status(complaint_id, AutoAssignmentStatus.REVIEW_REQUIRED)
    
    # Create audit log
    audit_log = AutoAssignmentAuditLog(
        grievance_id=complaint_id,
        action="rejected",
        admin_id=admin.get("user_id", "unknown"),
        admin_name=admin.get("name", admin.get("email", "Admin")),
        timestamp=datetime.now().isoformat(),
        nlp_suggestion=auto_data.suggested_department,
        final_department=None,
        confidence_score=auto_data.confidence_score,
        remarks=request.reason
    )
    auto_assignment_store.add_audit_log(audit_log)
    
    return {
        "success": True,
        "message": f"Auto-assignment for {complaint_id} rejected. Marked for manual review.",
        "complaint": grievance.model_dump()
    }


@router.post("/bulk")
async def bulk_assignment_action(
    request: BulkAssignmentRequest,
    admin: dict = Depends(require_admin)
):
    """
    Perform bulk approve or reject on multiple complaints.
    """
    if request.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    if request.action == "approve" and not request.department:
        raise HTTPException(status_code=400, detail="Department is required for bulk approve")
    
    results = {
        "success_count": 0,
        "failed_count": 0,
        "failures": []
    }
    
    for complaint_id in request.complaint_ids:
        try:
            if request.action == "approve":
                await approve_assignment(
                    complaint_id,
                    ApproveAssignmentRequest(
                        department=request.department,
                        remarks=request.remarks or "Bulk approved"
                    ),
                    admin
                )
            else:
                await reject_assignment(
                    complaint_id,
                    RejectAssignmentRequest(reason=request.remarks or "Bulk rejected"),
                    admin
                )
            results["success_count"] += 1
        except Exception as e:
            results["failed_count"] += 1
            results["failures"].append({
                "complaint_id": complaint_id,
                "error": str(e)
            })
    
    return {
        "success": True,
        "message": f"Bulk {request.action} completed: {results['success_count']} succeeded, {results['failed_count']} failed",
        "results": results
    }


@router.get("/audit-logs")
async def get_audit_logs(
    complaint_id: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    admin: dict = Depends(require_admin)
):
    """Get audit logs for auto-assignment decisions"""
    logs = auto_assignment_store.get_audit_logs(grievance_id=complaint_id, limit=limit)
    return {
        "success": True,
        "logs": [log.model_dump() for log in logs],
        "total": len(logs)
    }


@router.get("/{complaint_id}")
async def get_auto_assignment_detail(
    complaint_id: str,
    admin: dict = Depends(require_admin)
):
    """Get auto-assignment details for a specific complaint"""
    grievance = data_store.get_grievance(complaint_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    auto_data = auto_assignment_store.get_auto_assignment(complaint_id)
    if not auto_data:
        raise HTTPException(status_code=404, detail="No auto-assignment data found")
    
    # Get audit logs for this complaint
    audit_logs = auto_assignment_store.get_audit_logs(grievance_id=complaint_id)
    
    return {
        "success": True,
        "complaint": grievance.model_dump(),
        "auto_assignment": auto_data.model_dump(),
        "audit_logs": [log.model_dump() for log in audit_logs]
    }
