from typing import Literal

from pydantic import BaseModel, Field

from models.common import LocationData


class ComplaintCreate(BaseModel):
    """
    Initial complaint submitted by a citizen.

    The complaint can originate from text or voice.
    Voice input will be converted to text before the
    complaint enters the AI analysis pipeline.
    """

    citizen_id: str | None = None

    citizen_name: str | None = Field(
        default=None,
        max_length=200,
    )

    phone_number: str | None = Field(
        default=None,
        max_length=30,
    )

    email: str | None = Field(
        default=None,
        max_length=320,
    )

    telegram_chat_id: str | None = None

    original_input: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Original text provided by the citizen.",
    )

    input_type: Literal[
        "text",
        "voice",
    ] = "text"

    input_language: str | None = Field(
        default=None,
        description=(
            "Language supplied by the client if known. "
            "The backend can detect it when omitted."
        ),
    )

    output_language: str | None = Field(
        default=None,
        description=(
            "Preferred language for the generated grievance "
            "and citizen-facing response."
        ),
    )

    location: LocationData | None = None

    metadata: dict = Field(
        default_factory=dict,
    )


class ComplaintResponse(BaseModel):
    """Basic complaint response."""

    id: str

    complaint_number: str | None = None

    citizen_id: str

    original_input: str

    input_type: str

    detected_language: str | None = None

    input_language_code: str | None = None

    normalized_text: str | None = None

    output_language: str | None = None

    relevance: str | None = None

    relevance_score: float | None = None

    relevance_reason: str | None = None

    issue_category: str | None = None

    location_text: str | None = None

    latitude: float | None = None

    longitude: float | None = None

    severity_score: float | None = None

    severity_level: str | None = None

    status: str

    is_new_issue: bool

    is_supporting_existing_issue: bool

    citizen_approved: bool

    created_at: str
    updated_at: str