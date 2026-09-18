import json
from typing import Any

from prompts.issue_analysis_prompt import SYSTEM_PROMPT
from services.groq_service import generate_completion


def _extract_json(text: str) -> dict[str, Any]:
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


def analyze_issue(
    complaint_text: str,
    location_text: str | None = None,
    categories: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:

    if not complaint_text.strip():
        raise ValueError("Complaint text cannot be empty.")

    category_context = categories or []

    user_prompt = f"""
Citizen complaint:

{complaint_text}

Additional location supplied by citizen:

{location_text or "Not provided"}

Available issue categories:

{json.dumps(category_context, ensure_ascii=False, indent=2)}

Analyze the complaint and return the required JSON structure.
"""

    response = generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.0,
    )

    result = _extract_json(response)

    required_fields = [
        "normalized_text",
        "issue_summary",
        "issue_category",
        "issue_category_confidence",
        "location_text",
        "problem",
        "requested_action",
        "duration",
        "affected_people",
        "key_facts",
        "missing_information",
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(
                f"Groq response missing field: {field}"
            )

    return result