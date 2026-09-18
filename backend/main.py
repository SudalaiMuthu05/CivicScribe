from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from routes.health_routes import router as health_router
from routes.complaint_routes import router as complaint_router
from routes.analysis_routes import router as analysis_router
from routes.image_routes import router as image_router
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "CivicScribe - AI-powered multilingual, "
        "multimodal citizen grievance platform."
    ),
    debug=settings.debug,
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROUTES
# ==========================================

app.include_router(health_router)
app.include_router(complaint_router)
app.include_router(analysis_router)
app.include_router(image_router)

# ==========================================
# ROOT
# ==========================================

@app.get("/")
async def root():
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "message": "CivicScribe API is running.",
    }