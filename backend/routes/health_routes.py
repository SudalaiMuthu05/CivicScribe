from fastapi import APIRouter

from config.settings import settings
from database.supabase_client import supabase


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "application": settings.app_name,
        "version": settings.app_version,
    }


@router.get("/supabase")
async def supabase_health_check():
    """
    Test the connection between FastAPI and Supabase.
    """

    try:
        response = (
            supabase
            .table("issue_categories")
            .select("id, code, name")
            .limit(1)
            .execute()
        )

        return {
            "status": "connected",
            "database": "supabase",
            "test": "successful",
            "records_found": len(response.data or []),
        }

    except Exception as exc:
        return {
            "status": "error",
            "database": "supabase",
            "test": "failed",
            "error": str(exc),
        }