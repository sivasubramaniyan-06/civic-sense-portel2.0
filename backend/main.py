"""
Civic Sense Portal - FastAPI Backend
Main entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routers import grievances, admin, auth, user, media, admin_analytics, auto_assignment

# Create FastAPI app
app = FastAPI(
    title="Civic Sense Portal API",
    description="AI-powered Public Grievance Redressal System",
    version="1.0.0"
)

# CORS middleware for frontend communication
# Read from environment variable, default to "*" for compatibility
frontend_url = os.environ.get("FRONTEND_URL", "*")
allowed_origins = [frontend_url] if frontend_url != "*" else ["*"]

# Add localhost for development
if frontend_url != "*":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(grievances.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(media.router)
app.include_router(admin_analytics.router)
app.include_router(auto_assignment.router)

# Create uploads directory if not exists
os.makedirs("uploads/audio", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Civic Sense Portal API",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "database": "in-memory",
        "ai_service": "active"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
