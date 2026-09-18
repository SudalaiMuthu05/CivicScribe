import json

from services.ai_service import ask_llm


def validate_draft(
    draft: str,
    facts: dict,
    request_type: str
):

    prompt = f"""
You are a strict validation engine for an AI civic
application drafting system.

Your job is to check whether the generated draft is
faithful to the citizen's provided facts.

REQUEST TYPE:
{request_type}

CITIZEN FACTS:
{json.dumps(facts, indent=2)}

GENERATED DRAFT:
{draft}

Check the draft for:

1. UNSUPPORTED_FACTS
   Claims about the citizen's situation that are not
   present in the provided facts.

2. INVENTED_DETAILS
   Dates, locations, authorities, financial years,
   amounts, complaints, events, documents, allegations,
   or other details that were not provided.

3. UNREQUESTED_ACTIONS
   Actions requested from the government that the
   citizen did not request.

4. INTENT_MISMATCH
   Whether the draft changes the request type or
   meaning.

5. FACT_CONSISTENCY
   Whether the facts explicitly provided by the citizen
   are represented correctly.

IMPORTANT:

- Do NOT consider standard formatting such as
  [Name], [Address], [Date], or [Contact Number]
  to be hallucinated facts.
- Do NOT flag normal formal language by itself.
- Only flag factual claims or requested actions
  that are unsupported.
- Missing optional application fields are not
  hallucinations.
- Be strict.

Return ONLY valid JSON:

{{
    "is_valid": true,
    "issues": [
        {{
            "type": "UNSUPPORTED_FACTS",
            "text": "exact problematic statement",
            "reason": "why it is unsupported"
        }}
    ],
    "unsupported_facts": [],
    "unrequested_actions": [],
    "intent_mismatch": [],
    "fact_consistency": "PASS"
}}
"""

    result = ask_llm(prompt)

    result = result.strip()

    if result.startswith("```"):
        result = result.replace("```json", "")
        result = result.replace("```", "")
        result = result.strip()

    try:
        return json.loads(result)

    except json.JSONDecodeError:
        raise ValueError(
            f"Validation engine returned invalid JSON: {result}"
        )