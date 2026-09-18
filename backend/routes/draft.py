from fastapi import APIRouter
import json

from models.schemas import (
    DraftRequest,
    DraftResponse
)

from services.ai_service import ask_llm
from services.rag_service import search_knowledge
from services.validation_service import validate_draft


router = APIRouter()


@router.post(
    "/generate-draft",
    response_model=DraftResponse
)
def generate_draft(request: DraftRequest):

    facts = request.facts.model_dump()

    # -----------------------------------------
    # 1. RAG SEARCH
    # -----------------------------------------

    rag_query = f"""
Request type: {request.request_type}
Category: {request.category}
Issue: {facts.get("issue")}
Requested action: {facts.get("requested_action")}
Requested information: {facts.get("requested_information")}
"""

    knowledge = search_knowledge(
        query=rag_query,
        match_count=3,
        document_type=request.request_type
    )

    # -----------------------------------------
    # 2. BUILD RAG CONTEXT
    # -----------------------------------------

    rag_context = ""

    for index, item in enumerate(knowledge, start=1):

        rag_context += f"""
SOURCE {index}
Title: {item.get("title")}
Source: {item.get("source")}
Content:
{item.get("content")}

"""

    # -----------------------------------------
    # 3. GENERATE INITIAL DRAFT
    # -----------------------------------------

    prompt = f"""
You are an AI civic drafting assistant.

Generate a formal government application based ONLY
on the citizen's provided facts.

REQUEST TYPE:
{request.request_type}

CATEGORY:
{request.category}

CITIZEN FACTS:
{json.dumps(facts, indent=2)}

OFFICIAL GOVERNMENT GUIDANCE:
{rag_context}

STRICT RULES:

1. Use ONLY facts explicitly provided by the citizen.

2. NEVER invent or assume:
- residence
- dates
- locations
- authorities
- departments
- previous complaints
- accidents
- injuries
- safety hazards
- financial amounts
- financial years
- contractors
- documents
- allegations
- events

3. Do not expand a citizen's statement into a stronger
claim.

4. Do not add facts just because they are common or
logically possible.

5. Do not add requested actions that the citizen did
not request.

6. Official government guidance may be used only for
general procedure and document structure.

7. Do not present information from the government
guidance as if it happened in the citizen's case.

8. Use placeholders such as [Name], [Address], [Date]
where appropriate.

9. Preserve the exact meaning of the citizen's request.

"""

    if request.request_type.upper() == "GRIEVANCE":

        prompt += """
For a GRIEVANCE:

Create a formal grievance requesting action.

Include:
- Subject
- Issue description
- Location if provided
- Duration if provided
- Previous complaint details if provided
- Requested action

Do not add additional complaints or actions.
"""

    else:

        prompt += """
For an RTI:

Create a formal RTI application seeking information
or records.

Include:
- Subject
- Brief context
- Information explicitly requested by the citizen
- Applicant placeholders

Do not invent financial years, documents,
contractors, amounts or additional questions.

Do not request government action through the RTI draft.
"""

    prompt += """

Return ONLY the final application text.
"""

    draft = ask_llm(prompt).strip()

    # -----------------------------------------
    # 4. VALIDATE INITIAL DRAFT
    # -----------------------------------------

    validation = validate_draft(
        draft=draft,
        facts=facts,
        request_type=request.request_type
    )

    # -----------------------------------------
    # 5. AUTOMATIC CORRECTION
    # -----------------------------------------

    if not validation.get("is_valid", False):

        correction_prompt = f"""
You are a strict civic document correction engine.

The citizen provided these facts:

{json.dumps(facts, indent=2)}

Request type:
{request.request_type}

Original generated draft:

{draft}

Validation result:

{json.dumps(validation, indent=2)}

Rewrite the draft so that EVERY factual statement
is supported by the citizen's facts.

IMPORTANT:

1. Remove unsupported facts.

2. Remove invented details.

3. Remove unrequested actions.

4. Never invent dates, authorities, locations,
financial years, amounts, events or allegations.

5. Do not strengthen the citizen's claims.

6. Preserve all valid facts.

7. Keep the formal government application structure.

8. Use placeholders where applicant information
is missing.

Return ONLY the corrected application.
"""

        corrected_draft = ask_llm(
            correction_prompt
        ).strip()

        # -----------------------------------------
        # 6. VALIDATE CORRECTED DRAFT
        # -----------------------------------------

        final_validation = validate_draft(
            draft=corrected_draft,
            facts=facts,
            request_type=request.request_type
        )

        if final_validation.get("is_valid", False):
            draft = corrected_draft
            validation = final_validation
        else:
            draft = corrected_draft
            validation = final_validation

    # -----------------------------------------
    # 7. REMOVE DUPLICATE SOURCES
    # -----------------------------------------

    sources = []

    seen = set()

    for item in knowledge:

        key = (
            item.get("title"),
            item.get("source"),
            item.get("source_url")
        )

        if key in seen:
            continue

        seen.add(key)

        sources.append({
            "title": item.get("title"),
            "source": item.get("source"),
            "source_url": item.get("source_url")
        })

    # -----------------------------------------
    # 8. SANITIZE RAW MARKDOWN
    # -----------------------------------------

    import re
    clean_draft = re.sub(r"```[a-zA-Z]*\n?", "", draft)
    clean_draft = clean_draft.replace("```", "")
    clean_draft = re.sub(r"(?m)^#{1,6}\s*", "", clean_draft)
    clean_draft = re.sub(r"\*\*([^*]+)\*\*", r"\1", clean_draft)
    clean_draft = re.sub(r"\*([^*]+)\*", r"\1", clean_draft)
    clean_draft = re.sub(r"__([^_]+)__", r"\1", clean_draft)
    clean_draft = re.sub(r"_([^_]+)_", r"\1", clean_draft)
    clean_draft = re.sub(r"(?m)^[-*]\s+", "• ", clean_draft).strip()

    # -----------------------------------------
    # 9. RETURN FINAL RESULT
    # -----------------------------------------

    return {
        "draft": clean_draft,
        "sources": sources
    }