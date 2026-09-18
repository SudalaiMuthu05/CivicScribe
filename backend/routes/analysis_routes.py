from fastapi import APIRouter, HTTPException

from models.complaint import ComplaintCreate

from services.relevance_service import analyze_relevance
from services.issue_analysis_service import analyze_issue

from database.repositories.issue_repository import IssueRepository
from services.severity_service import analyze_severity

router = APIRouter(
    prefix="/analysis",
    tags=["AI Analysis"],
)


issue_repository = IssueRepository()


@router.post("/relevance")
async def check_relevance(request: ComplaintCreate):

    try:

        result = analyze_relevance(
            request.original_input
        )

        return {
            "success": True,
            "data": result,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(f"Relevance analysis error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="AI relevance analysis failed.",
        ) from exc


@router.post("/issue")
async def check_issue(request: ComplaintCreate):

    try:

        # Get issue categories from Supabase
        categories = issue_repository.get_categories()

        # Get location supplied by citizen
        location_text = None

        if request.location:
            location_text = request.location.text

        # Analyze complaint using Groq
        result = analyze_issue(
            complaint_text=request.original_input,
            location_text=location_text,
            categories=categories,
        )

        return {
            "success": True,
            "data": result,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(f"Issue analysis error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="AI issue analysis failed.",
        ) from exc

@router.post("/severity")
async def check_severity(request: ComplaintCreate):

    try:
        # First understand the complaint
        categories = issue_repository.get_categories()

        location_text = None

        if request.location:
            location_text = request.location.text

        issue_analysis = analyze_issue(
            complaint_text=request.original_input,
            location_text=location_text,
            categories=categories,
        )

        # Then analyze severity
        result = analyze_severity(
            complaint_text=request.original_input,
            issue_analysis=issue_analysis,
        )

        return {
            "success": True,
            "data": {
                "issue_analysis": issue_analysis,
                "severity": result,
            },
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        print(f"Severity analysis error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="AI severity analysis failed.",
        ) from exc