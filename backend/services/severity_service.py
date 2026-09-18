import json
from typing import Any

from prompts.severity_prompt import SYSTEM_PROMPT
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
            "Groq returned an invalid severity JSON response."
        ) from exc


def analyze_severity(
    complaint_text: str,
    issue_analysis: dict[str, Any],
) -> dict[str, Any]:

    user_prompt = f"""
Original citizen complaint:

{complaint_text}

Structured issue analysis:

{json.dumps(
    issue_analysis,
    ensure_ascii=False,
    indent=2
)}

Analyze the attention level of this civic issue.

Return only the required JSON.
"""

    response = generate_completion(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.0,
    )

    result = _extract_json(response)

    required_fields = [
        "severity_score",
        "severity_level",
        "severity_explanation",
        "risk_factors",
    ]

    for field in required_fields:

        if field not in result:

            raise ValueError(
                f"Groq response missing field: {field}"
            )

    # Safety validation

    score = float(
        result["severity_score"]
    )

    if score < 0 or score > 100:

        raise ValueError(
            "Severity score must be between 0 and 100."
        )

    result["severity_score"] = score

    return result