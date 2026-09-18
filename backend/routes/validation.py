from fastapi import APIRouter

from models.schemas import (
    ValidationResponse
)

from services.validation_service import validate_draft


router = APIRouter()


@router.post(
    "/validate-draft",
    response_model=ValidationResponse
)
def validate_generated_draft(
    draft: str,
    request_type: str,
    facts: dict
):

    result = validate_draft(
        draft=draft,
        facts=facts,
        request_type=request_type
    )

    return result