from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class APIResponse(BaseModel):
    """Common API response structure."""

    success: bool = True
    message: str
    data: Any | None = None


class LocationData(BaseModel):
    """Location information supplied by the citizen."""

    text: str | None = Field(
        default=None,
        description="Human-readable location provided by the citizen.",
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    postal_code: str | None = None

    model_config = ConfigDict(extra="allow")