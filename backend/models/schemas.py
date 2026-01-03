"""
Pydantic models for Civic Sense Portal
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class GrievanceCategory(str, Enum):
    ROAD = "road"
    WATER = "water"
    ELECTRICITY = "electricity"
    SANITATION = "sanitation"
    HEALTH_SAFETY = "health_safety"
    OTHERS = "others"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Status(str, Enum):
    SUBMITTED = "submitted"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class GrievanceSubmission(BaseModel):
    """Request model for submitting a grievance"""
    category: GrievanceCategory
    description: str = Field(..., min_length=20, max_length=2000)
    location: str
    image_base64: Optional[str] = None
    submitter_name: Optional[str] = "Anonymous"
    submitter_phone: Optional[str] = None
    submitter_email: Optional[str] = None


class ClassificationResult(BaseModel):
    """AI classification output"""
    detected_category: GrievanceCategory
    priority: Priority
    department: str
    explanation: str
    keywords_found: List[str]


class DuplicateCheckRequest(BaseModel):
    """Request to check for duplicate complaints"""
    description: str
    category: GrievanceCategory


class DuplicateCheckResponse(BaseModel):
    """Response for duplicate check"""
    is_duplicate: bool
    similar_complaint_id: Optional[str] = None
    similarity_score: float = 0.0
    message: str


class TimelineEntry(BaseModel):
    """Single entry in grievance timeline"""
    status: Status
    timestamp: str
    remarks: Optional[str] = None


class Grievance(BaseModel):
    """Complete grievance record"""
    id: str
    category: GrievanceCategory
    description: str
    location: str
    image_path: Optional[str] = None
    image_data: Optional[str] = None  # Base64 image data for preview
    submitter_name: str
    submitter_phone: Optional[str] = None
    submitter_email: Optional[str] = None
    status: Status = Status.SUBMITTED
    priority: Priority = Priority.MEDIUM
    department: str = "General"
    ai_explanation: str = ""
    keywords_found: List[str] = []
    is_duplicate: bool = False
    similar_to: Optional[str] = None
    duplicate_score: float = 0.0  # Similarity percentage
    timeline: List[TimelineEntry] = []
    created_at: str
    updated_at: str


class GrievanceResponse(BaseModel):
    """Response after grievance submission"""
    success: bool
    complaint_id: str
    message: str
    classification: ClassificationResult


class StatusUpdateRequest(BaseModel):
    """Request to update grievance status"""
    status: Status
    remarks: Optional[str] = None


class AdminLoginRequest(BaseModel):
    """Mock admin login"""
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    """Mock admin login response"""
    success: bool
    token: Optional[str] = None
    message: str
