from pydantic import BaseModel, Field


class CitizenCreate(BaseModel):
    """Information required to create a citizen profile."""

    name: str = Field(
        ...,
        min_length=1,
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

    preferred_language: str | None = None

    preferred_input_language: str | None = None


class CitizenResponse(BaseModel):
    """Citizen information returned by the API."""

    id: str
    name: str

    phone_number: str | None = None
    email: str | None = None

    telegram_chat_id: str | None = None

    preferred_language: str | None = None
    preferred_input_language: str | None = None