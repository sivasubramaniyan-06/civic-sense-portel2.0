"""
Pydantic models for Auto Assignment Feature
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

from models.schemas import GrievanceCategory


class AutoAssignmentStatus(str, Enum):
    """Status of auto-assignment suggestion"""
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVIEW_REQUIRED = "review_required"


class AutoAssignmentData(BaseModel):
    """Auto-assignment metadata stored with grievance"""
    auto_category: GrievanceCategory
    suggested_department: str
    confidence_score: float = Field(..., ge=0, le=100)
    auto_status: AutoAssignmentStatus = AutoAssignmentStatus.PENDING_APPROVAL
    analyzed_at: str  # ISO timestamp
    keywords_matched: List[str] = []


class AutoAssignmentAuditLog(BaseModel):
    """Audit log entry for auto-assignment decisions"""
    grievance_id: str
    action: str  # 'approved', 'rejected', 'modified'
    admin_id: str
    admin_name: str
    timestamp: str
    nlp_suggestion: str  # Original suggested department
    final_department: Optional[str] = None  # Department after admin decision
    confidence_score: float
    remarks: Optional[str] = None


class AutoAssignmentQueueItem(BaseModel):
    """Single item in the auto-assignment queue"""
    complaint_id: str
    complaint_summary: str
    location: str
    nlp_category: str
    suggested_department: str
    confidence_score: float
    days_since_submission: int
    current_status: str
    priority: str
    created_at: str
    keywords_found: List[str] = []


class AutoAssignmentQueueResponse(BaseModel):
    """Response for auto-assignment queue"""
    success: bool
    items: List[AutoAssignmentQueueItem]
    total: int
    pending_count: int
    approved_count: int
    rejected_count: int


class AutoAssignmentConfig(BaseModel):
    """Admin configuration for auto-assignment"""
    review_window_days: int = Field(default=20, ge=1, le=90)
    auto_assign_threshold: float = Field(default=85.0, ge=0, le=100)  # Future use
    enabled: bool = True


class ApproveAssignmentRequest(BaseModel):
    """Request to approve auto-assignment"""
    department: str  # Can be same as suggested or overridden
    remarks: Optional[str] = None


class RejectAssignmentRequest(BaseModel):
    """Request to reject auto-assignment"""
    reason: Optional[str] = None


class BulkAssignmentRequest(BaseModel):
    """Request for bulk assignment operations"""
    complaint_ids: List[str]
    action: str  # 'approve' or 'reject'
    department: Optional[str] = None  # Required if action is 'approve'
    remarks: Optional[str] = None
