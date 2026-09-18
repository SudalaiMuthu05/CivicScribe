import json
from typing import Any

from prompts.relevance_prompt import SYSTEM_PROMPT
from services.groq_service import generate_completion


def _extract_json(text: str) -> dict[str, Any]:
    """
    Extract JSON from the model response.

    The model is instructed to return JSON, but this function
    also handles responses surrounded by markdown fences.
    """

    cleaned = text.strip()

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()

        if lines:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)

    except json.JSONDecodeError as exc:
        raise ValueError(
            "Groq returned an invalid JSON response."
        ) from exc


def analyze_relevance(
    complaint_text: str,
) -> dict[str, Any]:
    """
    Determine whether the citizen input is a relevant
    civic complaint.
    """

    if not complaint_text.strip():
        raise ValueError(
            "Complaint text cannot be empty."
        )

    response = generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=complaint_text,
        temperature=0.0,
    )

    result = _extract_json(response)

    required_fields = [
        "is_relevant",
        "relevance_score",
        "reason",
        "detected_language",
        "language_code",
    ]

    for field in required_fields:

        if field not in result:
            raise ValueError(
                f"Groq response missing field: {field}"
            )

    return result