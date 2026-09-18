import json
from typing import Any

from database.repositories.authority_repository import AuthorityRepository
from services.groq_service import generate_completion
from prompts.authority_routing_prompt import AUTHORITY_ROUTING_SYSTEM_PROMPT


class AuthorityRoutingService:

    def __init__(self) -> None:
        self.authority_repository = AuthorityRepository()

    def route_complaint(
        self,
        complaint_text: str,
        issue_analysis: dict[str, Any],
        severity: dict[str, Any],
        issue_category_id: str | None = None,
        jurisdiction_id: str | None = None,
    ) -> dict[str, Any]:

        # ---------------------------------------------------------
        # 1. Fetch active authorities from Supabase
        # ---------------------------------------------------------
        authorities = (
            self.authority_repository
            .get_active_authorities()
        )

        if not authorities:
            raise ValueError(
                "No active authorities are available for routing."
            )

        # ---------------------------------------------------------
        # 2. Fetch routing knowledge from Supabase
        # ---------------------------------------------------------
        routing_rules = (
            self.authority_repository
            .get_routing_rules(
                issue_category_id=issue_category_id,
                jurisdiction_id=jurisdiction_id,
            )
        )

        # ---------------------------------------------------------
        # 3. Prepare only useful authority information for the AI
        # ---------------------------------------------------------
        authority_context = []

        for authority in authorities:

            authority_context.append({
                "id": authority.get("id"),
                "name": authority.get("name"),
                "authority_type": authority.get("authority_type"),
                "description": authority.get("description"),
                "supports_online_submission": authority.get(
                    "supports_online_submission"
                ),
                "supports_attachments": authority.get(
                    "supports_attachments"
                ),
                "metadata": authority.get("metadata") or {},
            })

        # ---------------------------------------------------------
        # 4. Prepare routing-rule context
        # ---------------------------------------------------------
        routing_context = []

        for rule in routing_rules:

            routing_context.append({
                "issue_category_id": rule.get(
                    "issue_category_id"
                ),
                "jurisdiction_id": rule.get(
                    "jurisdiction_id"
                ),
                "authority_id": rule.get(
                    "authority_id"
                ),
                "priority": rule.get("priority"),
                "conditions": rule.get("conditions") or {},
            })

        # ---------------------------------------------------------
        # 5. Build AI input
        # ---------------------------------------------------------
        routing_input = {
            "complaint": complaint_text,

            "issue_analysis": {
                "normalized_text": issue_analysis.get(
                    "normalized_text"
                ),
                "issue_summary": issue_analysis.get(
                    "issue_summary"
                ),
                "issue_category": issue_analysis.get(
                    "issue_category"
                ),
                "issue_category_confidence": issue_analysis.get(
                    "issue_category_confidence"
                ),
                "location_text": issue_analysis.get(
                    "location_text"
                ),
                "problem": issue_analysis.get(
                    "problem"
                ),
                "requested_action": issue_analysis.get(
                    "requested_action"
                ),
                "duration": issue_analysis.get(
                    "duration"
                ),
                "affected_people": issue_analysis.get(
                    "affected_people"
                ),
                "key_facts": issue_analysis.get(
                    "key_facts"
                ),
                "missing_information": issue_analysis.get(
                    "missing_information"
                ),
            },

            "severity": {
                "severity_score": severity.get(
                    "severity_score"
                ),
                "severity_level": severity.get(
                    "severity_level"
                ),
                "severity_explanation": severity.get(
                    "severity_explanation"
                ),
                "risk_factors": severity.get(
                    "risk_factors"
                ),
            },

            "jurisdiction_id": jurisdiction_id,

            "available_authorities": authority_context,

            "routing_knowledge": routing_context,
        }

        # ---------------------------------------------------------
        # 6. Ask Groq AI to select the authority
        # ---------------------------------------------------------
        user_prompt = f"""
Analyze the following civic complaint and determine the most
appropriate authority.

You MUST select the authority only from the supplied
available_authorities list.

Do not invent an authority.

Do not use a fixed category-to-authority mapping.

Use the actual complaint context, location, issue description,
requested action, severity and authority information.

INPUT:

{json.dumps(routing_input, ensure_ascii=False, indent=2)}
"""

        raw_response = generate_completion(
            system_prompt=AUTHORITY_ROUTING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.0,
        )

        # ---------------------------------------------------------
        # 7. Parse AI response
        # ---------------------------------------------------------
        try:
            routing_result = json.loads(raw_response)
        except json.JSONDecodeError as error:
            raise ValueError(
                f"Authority routing AI returned invalid JSON: "
                f"{raw_response}"
            ) from error

        # ---------------------------------------------------------
        # 8. Validate response structure
        # ---------------------------------------------------------
        selected_authority_id = routing_result.get(
            "selected_authority_id"
        )

        needs_more_information = routing_result.get(
            "needs_more_information",
            False,
        )

        if needs_more_information:
            return {
                "routing_status": "needs_more_information",
                "selected_authority_id": None,
                "authority_name": None,
                "confidence": routing_result.get(
                    "confidence",
                    0,
                ),
                "reason": routing_result.get(
                    "reason",
                    "More information is required.",
                ),
                "missing_information": routing_result.get(
                    "missing_information",
                    [],
                ),
            }

        if not selected_authority_id:
            raise ValueError(
                "Authority routing AI did not select an authority."
            )

        # ---------------------------------------------------------
        # 9. CRITICAL SECURITY VALIDATION
        #
        # AI is NOT trusted to invent authority IDs.
        # We verify the selected ID against Supabase.
        # ---------------------------------------------------------
        selected_authority = (
            self.authority_repository
            .get_authority_by_id(
                selected_authority_id
            )
        )

        if selected_authority is None:
            raise ValueError(
                "AI selected an authority that does not exist "
                "or is inactive in the database."
            )

        # ---------------------------------------------------------
        # 10. Verify AI's authority name against database
        # ---------------------------------------------------------
        ai_authority_name = routing_result.get(
            "authority_name"
        )

        database_authority_name = selected_authority.get(
            "name"
        )

        # We don't reject solely because of a name mismatch.
        # The UUID is the authoritative identifier.
        name_verified = (
            not ai_authority_name
            or ai_authority_name.strip().lower()
            == database_authority_name.strip().lower()
        )

        # ---------------------------------------------------------
        # 11. Return final routing result
        # ---------------------------------------------------------
        return {
            "routing_status": "routed",

            "selected_authority_id": selected_authority.get(
                "id"
            ),

            "authority_name": selected_authority.get(
                "name"
            ),

            "authority_type": selected_authority.get(
                "authority_type"
            ),

            "confidence": routing_result.get(
                "confidence",
                0,
            ),

            "reason": routing_result.get(
                "reason",
                "",
            ),

            "needs_more_information": False,

            "missing_information": routing_result.get(
                "missing_information",
                [],
            ),

            "name_verified": name_verified,

            "supports_online_submission": selected_authority.get(
                "supports_online_submission"
            ),

            "supports_attachments": selected_authority.get(
                "supports_attachments"
            ),

            "official_website": selected_authority.get(
                "official_website"
            ),

            "official_email": selected_authority.get(
                "official_email"
            ),

            "official_phone": selected_authority.get(
                "official_phone"
            ),

            "submission_url": selected_authority.get(
                "submission_url"
            ),
        }


def route_complaint_to_authority(
    complaint_text: str,
    issue_analysis: dict[str, Any],
    severity: dict[str, Any],
    issue_category_id: str | None = None,
    jurisdiction_id: str | None = None,
) -> dict[str, Any]:

    service = AuthorityRoutingService()

    return service.route_complaint(
        complaint_text=complaint_text,
        issue_analysis=issue_analysis,
        severity=severity,
        issue_category_id=issue_category_id,
        jurisdiction_id=jurisdiction_id,
    )