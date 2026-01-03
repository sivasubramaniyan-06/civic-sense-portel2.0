"""
Civic Sense Portal - FastAPI Backend
Main entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import grievances, admin, auth

# Create FastAPI app
app = FastAPI(
    title="Civic Sense Portal API",
    description="AI-powered Public Grievance Redressal System",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(grievances.router)
app.include_router(admin.router)
app.include_router(auth.router)


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
