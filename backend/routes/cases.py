from fastapi import APIRouter, HTTPException
from uuid import uuid4

from models.schemas import (
    CreateCaseRequest,
    CreateCaseResponse,
    UpdateCaseStatusRequest,
    CaseStatusResponse
)

from services.supabase_service import test_supabase_connection


router = APIRouter()


ALLOWED_STATUSES = [
    "DRAFT",
    "APPROVED",
    "SUBMITTED",
    "UNDER_REVIEW",
    "ACTION_IN_PROGRESS",
    "RESOLVED"
]


@router.post(
    "/cases",
    response_model=CreateCaseResponse
)
def create_case(request: CreateCaseRequest):

    supabase = test_supabase_connection()

    case_number = f"GS-{uuid4().hex[:8].upper()}"

    case_data = {
        "case_number": case_number,
        "original_request": request.original_request,
        "request_type": request.request_type,
        "category": request.category,
        "extracted_facts": request.extracted_facts.model_dump(),
        "draft": request.draft,
        "status": "DRAFT"
    }

    try:

        response = (
            supabase
            .table("cases")
            .insert(case_data)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create case"
            )

        created_case = response.data[0]

        return {
            "id": created_case["id"],
            "case_number": created_case["case_number"],
            "status": created_case["status"],
            "message": "Case created successfully",
            "original_request": created_case.get("original_request"),
            "request_type": created_case.get("request_type"),
            "category": created_case.get("category"),
            "draft": created_case.get("draft"),
            "created_at": created_case.get("created_at")
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get(
    "/cases"
)
def get_all_cases():

    supabase = test_supabase_connection()

    try:

        response = (
            supabase
            .table("cases")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "cases": response.data or []
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get(
    "/cases/{case_number}"
)
def get_case(case_number: str):

    supabase = test_supabase_connection()

    try:

        response = (
            supabase
            .table("cases")
            .select("*")
            .eq("case_number", case_number)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )

        return response.data

    except Exception as e:

        raise HTTPException(
            status_code=404,
            detail="Case not found"
        )


@router.patch(
    "/cases/{case_number}/status",
    response_model=CaseStatusResponse
)
def update_case_status(
    case_number: str,
    request: UpdateCaseStatusRequest
):

    status = request.status.upper()

    if status not in ALLOWED_STATUSES:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid case status",
                "allowed_statuses": ALLOWED_STATUSES
            }
        )

    supabase = test_supabase_connection()

    try:

        response = (
            supabase
            .table("cases")
            .update({
                "status": status
            })
            .eq("case_number", case_number)
            .execute()
        )

        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Case not found"
            )

        return {
            "case_number": case_number,
            "status": status,
            "message": "Case status updated successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )