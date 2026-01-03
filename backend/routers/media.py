"""
Media Upload Router - Handles audio and other media uploads
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from typing import Dict, Any

router = APIRouter(prefix="/api/media", tags=["Media"])

UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a"]

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Upload an audio voice note.
    Returns the file path and metadata.
    """
    # Validate content type
    if file.content_type not in ACCEPTED_AUDIO_TYPES and not file.filename.endswith(('.mp3', '.wav', '.m4a')):
        raise HTTPException(status_code=400, detail="Invalid audio format. Only MP3, WAV, and M4A allowed.")
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".mp3" # Default fallback
        
    filename = f"{uuid.uuid4()}{ext}"
    file_path = f"{UPLOAD_DIR}/{filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Get file size
        file_size = os.path.getsize(file_path)
            
        return {
            "success": True,
            "path": file_path,
            "metadata": {
                "original_name": file.filename,
                "size": file_size,
                "content_type": file.content_type
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
