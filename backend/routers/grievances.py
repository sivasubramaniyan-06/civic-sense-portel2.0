"""
Grievance API Routes
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from typing import Optional
from datetime import datetime
import base64
import os

from models.schemas import (
    GrievanceSubmission,
    Grievance,
    GrievanceResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    ClassificationResult,
    Status,
    TimelineEntry,
    GrievanceCategory
)
from storage.data_store import data_store
from services.ai_classifier import classify_grievance
from services.duplicate_checker import check_duplicates
from services.auth_utils import get_user_from_token

router = APIRouter(prefix="/api/grievances", tags=["Grievances"])


@router.post("/classify", response_model=ClassificationResult)
async def classify_complaint(description: str, category: GrievanceCategory):
    """
    Classify a grievance description and return AI analysis.
    Used for real-time preview before submission.
    """
    # Validate description
    if not description or len(description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Description must be at least 20 characters long."
        )
    
    result = classify_grievance(description, category)
    return result


@router.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(request: DuplicateCheckRequest):
    """
    Check if a similar complaint already exists.
    """
    # Validate description
    if not request.description or len(request.description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Description must be at least 20 characters long."
        )
    
    existing = data_store.get_descriptions_for_category(request.category.value)
    # Pass location if available (from extended request)
    location = getattr(request, 'location', '')
    result = check_duplicates(
        request.description, 
        request.category, 
        existing,
        new_location=location
    )
    return result


@router.post("", response_model=GrievanceResponse)
async def submit_grievance(submission: GrievanceSubmission, authorization: Optional[str] = Header(None)):
    """
    Submit a new grievance.
    Performs AI classification and duplicate check.
    Optionally links to authenticated user if token provided.
    """
    # Extract user_id from token if authenticated
    user_id = None
    if authorization:
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        user_data = get_user_from_token(token)
        if user_data:
            user_id = user_data.get("user_id")
    
    # Validate inputs
    if not submission.description or len(submission.description.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Description must be at least 20 characters long."
        )
    
    if not submission.location or len(submission.location.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Location is required."
        )
    
    # Classify the grievance
    classification = classify_grievance(submission.description, submission.category)
    
    # Check for duplicates with location
    existing = data_store.get_descriptions_for_category(submission.category.value)
    duplicate_check = check_duplicates(
        submission.description, 
        submission.category, 
        existing,
        new_location=submission.location
    )
    
    # Generate complaint ID
    complaint_id = data_store.generate_id()
    
    # Handle image - store base64 data for preview
    image_path = None
    image_data = None
    if submission.image_base64:
        # Store the base64 data directly for demo (in production, save to file system)
        image_path = f"uploads/{complaint_id}.jpg"
        image_data = submission.image_base64
    
    # Handle audio - PREFER pre-uploaded path from media API
    audio_path = submission.audio_path
    
    # Fallback to base64 if no path provided (legacy/alternative support)
    if not audio_path and submission.audio_base64:
        try:
            # Decode base64 and save to file
            import base64
            audio_data = submission.audio_base64
            # Remove data URL prefix if present
            if "," in audio_data:
                audio_data = audio_data.split(",")[1]
            audio_bytes = base64.b64decode(audio_data)
            audio_filename = f"audio/{complaint_id}.mp3"
            audio_full_path = f"uploads/{audio_filename}"
            os.makedirs(os.path.dirname(audio_full_path), exist_ok=True)
            with open(audio_full_path, "wb") as f:
                f.write(audio_bytes)
            audio_path = audio_filename
        except Exception as e:
            print(f"Failed to save audio: {e}")
    
    # Create grievance record
    now = datetime.now().isoformat()
    grievance = Grievance(
        id=complaint_id,
        category=classification.detected_category,
        description=submission.description,
        location=submission.location,
        image_path=image_path,
        image_data=image_data,
        audio_path=audio_path,
        submitter_name=submission.submitter_name or "Anonymous",
        submitter_phone=submission.submitter_phone,
        submitter_email=submission.submitter_email,
        lat=submission.lat,
        lng=submission.lng,
        audio_meta=submission.audio_meta,
        audio_language=submission.audio_language,
        user_id=user_id,  # Link to authenticated user
        status=Status.SUBMITTED,
        priority=classification.priority,
        department=classification.department,
        ai_explanation=classification.explanation,
        keywords_found=classification.keywords_found,
        is_duplicate=duplicate_check.is_duplicate,
        similar_to=duplicate_check.similar_complaint_id,
        duplicate_score=duplicate_check.similarity_score,
        timeline=[
            TimelineEntry(
                status=Status.SUBMITTED,
                timestamp=now,
                remarks="Grievance submitted successfully"
            )
        ],
        created_at=now,
        updated_at=now
    )
    
    # Store grievance
    data_store.create_grievance(grievance)
    
    return GrievanceResponse(
        success=True,
        complaint_id=complaint_id,
        message=f"Your grievance has been registered successfully. "
               f"Complaint ID: {complaint_id}. "
               f"Please save this ID for future reference.",
        classification=classification
    )


@router.get("/{grievance_id}", response_model=Grievance)
async def get_grievance(grievance_id: str):
    """
    Get grievance details by ID.
    """
    if not grievance_id or len(grievance_id.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Complaint ID is required."
        )
    
    grievance = data_store.get_grievance(grievance_id.strip().upper())
    if not grievance:
        raise HTTPException(
            status_code=404,
            detail=f"Grievance with ID {grievance_id} not found. "
                  f"Please check the complaint ID and try again."
        )
    return grievance
