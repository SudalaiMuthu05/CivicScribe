from fastapi import APIRouter
import json

from models.schemas import (
    FactExtractionRequest,
    FactExtractionResponse
)
from services.ai_service import ask_llm

router = APIRouter()


@router.post(
    "/extract-facts",
    response_model=FactExtractionResponse
)
def extract_facts(request: FactExtractionRequest):

    prompt = f"""
You are a fact extraction system for a civic application.

Extract ONLY information explicitly stated by the citizen.

NEVER invent, assume, or infer missing facts.

If a field is not mentioned, return null.

IMPORTANT:
The field "previous_complaint" MUST be a BOOLEAN.

Use:
true = the citizen explicitly says they previously made a complaint
false = the citizen explicitly says they did not make a complaint
null = the citizen does not mention any previous complaint

Do NOT put descriptive text inside "previous_complaint".

Extract:

- issue
- location
- duration
- previous_complaint
- previous_complaint_authority
- previous_complaint_date
- problem_details
- requested_action

Citizen request:

{request.text}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "facts": {{
        "issue": null,
        "location": null,
        "duration": null,
        "previous_complaint": null,
        "previous_complaint_authority": null,
        "previous_complaint_date": null,
        "problem_details": [],
        "requested_action": null
    }}
}}
"""

    result = ask_llm(prompt)

    # Remove markdown code fences if the model adds them
    result = result.strip()

    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

    try:
        data = json.loads(result)
    except json.JSONDecodeError:
        raise ValueError(
            f"LLM returned invalid JSON: {result}"
        )

    # Safety normalization for previous_complaint
    previous_complaint = data.get("facts", {}).get(
        "previous_complaint"
    )

    if isinstance(previous_complaint, str):
        value = previous_complaint.lower().strip()

        if value in ["true", "yes"]:
            data["facts"]["previous_complaint"] = True

        elif value in ["false", "no"]:
            data["facts"]["previous_complaint"] = False

        else:
            data["facts"]["previous_complaint"] = None

    return data