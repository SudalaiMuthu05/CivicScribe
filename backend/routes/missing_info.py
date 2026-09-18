from fastapi import APIRouter
import json

from models.schemas import (
    MissingInfoRequest,
    MissingInfoResponse
)

from services.ai_service import ask_llm


router = APIRouter()


@router.post(
    "/missing-info",
    response_model=MissingInfoResponse
)
def find_missing_information(
    request: MissingInfoRequest
):

    facts = request.facts.model_dump()
    request_type = (request.request_type or "").upper()
    category = request.category or ""

    prompt = f"""
You are an AI assistant helping citizens prepare formal government civic requests.

Your job is to identify important information about the ISSUE/REQUEST that is missing from the citizen's facts.

REQUEST TYPE: {request_type}
CATEGORY: {category}

Citizen provided facts:
{json.dumps(facts, indent=2)}

CRITICAL RULES:

1. ABSOLUTELY NEVER ASK FOR APPLICANT PERSONAL/IDENTITY DETAILS:
   - Do NOT ask for the applicant's name, full name, residential address, phone number, email address, ID proof, or signature.
   - Applicant details are collected in a separate identity step later.

2. REQUEST-TYPE SPECIFIC RULES:
   - If REQUEST TYPE is "GRIEVANCE":
     * Focus ONLY on issue-specific details needed by authorities to inspect, locate, or fix the problem (e.g., precise street/landmark/pole/meter number, previous complaint token/reference number).
     * NEVER ask RTI-related questions (e.g. do NOT ask for records, documents, files, expenditures, or "What information would you like to obtain through RTI").
     * NEVER ask "Which department do you want to address this RTI to?".
   - If REQUEST TYPE is "RTI":
     * Focus ONLY on specifics needed to locate official records or documents (e.g., specific time period/financial years, specific files or orders requested).
     * NEVER ask for grievance repair, resolution, or action.

3. DO NOT ASK FOR INFORMATION ALREADY PROVIDED:
   - Carefully read the facts. If a field or detail is already provided or clearly answered, do NOT ask for it again.

4. SUFFICIENCY:
   - If the provided facts already have enough detail to prepare a strong application, return empty arrays:
     "missing": [], "questions": []
   - Ask at most 2 concise, clear, essential questions. Do not ask unnecessary questions.

5. Return ONLY valid JSON in exactly this format:
{{
    "missing": [
        "short description of missing issue detail"
    ],
    "questions": [
        "concise question to ask the citizen"
    ]
}}
"""

    result = ask_llm(prompt)

    result = result.strip()

    # Remove markdown code fences if LLM adds them
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

    return data