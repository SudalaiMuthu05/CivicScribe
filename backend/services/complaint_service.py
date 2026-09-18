from typing import Any

from database.repositories.citizen_repository import CitizenRepository
from database.repositories.complaint_repository import ComplaintRepository
from database.repositories.issue_repository import IssueRepository

from models.complaint import ComplaintCreate

from services.relevance_service import analyze_relevance
from services.issue_analysis_service import analyze_issue
from services.duplicate_service import find_duplicate_issue
from services.severity_service import analyze_severity
from services.authority_routing_service import route_complaint_to_authority


class ComplaintService:

    def __init__(self) -> None:
        self.citizen_repository = CitizenRepository()
        self.complaint_repository = ComplaintRepository()
        self.issue_repository = IssueRepository()

    # =========================================================
    # CITIZEN
    # =========================================================

    def _get_or_create_citizen(
        self,
        request: ComplaintCreate,
    ) -> dict[str, Any]:

        # Existing citizen by ID
        if request.citizen_id:

            citizen = self.citizen_repository.get_citizen(
                request.citizen_id
            )

            if citizen is None:
                raise ValueError(
                    "The provided citizen_id does not exist."
                )

            return citizen

        # Existing citizen by phone
        if request.phone_number:

            citizen = self.citizen_repository.find_by_phone(
                request.phone_number
            )

            if citizen is not None:
                return citizen

        # Create new citizen
        if not request.citizen_name:
            raise ValueError(
                "citizen_name is required when creating "
                "a new citizen."
            )

        return self.citizen_repository.create_citizen(
            name=request.citizen_name,
            phone_number=request.phone_number,
            email=request.email,
            telegram_chat_id=request.telegram_chat_id,
            preferred_language=request.output_language,
            preferred_input_language=request.input_language,
        )

    # =========================================================
    # CREATE COMPLAINT
    # =========================================================

    def create_complaint(
        self,
        request: ComplaintCreate,
    ) -> dict[str, Any]:

        # =====================================================
        # 1. RELEVANCE CHECK
        # =====================================================

        relevance = analyze_relevance(
            request.original_input
        )

        # Reject unrelated content
        if not relevance.get("is_relevant", False):

            return {
                "accepted": False,
                "reason": relevance.get(
                    "reason",
                    "The input does not describe a civic issue.",
                ),
                "relevance": relevance,
            }

        # =====================================================
        # 2. GET / CREATE CITIZEN
        # =====================================================

        citizen = self._get_or_create_citizen(
            request
        )

        # =====================================================
        # 3. LOCATION
        # =====================================================

        location_text = None
        latitude = None
        longitude = None

        if request.location:

            location_text = request.location.text
            latitude = request.location.latitude
            longitude = request.location.longitude

        # =====================================================
        # 4. AI ISSUE UNDERSTANDING
        # =====================================================

        categories = (
            self.issue_repository.get_categories()
        )

        issue_analysis = analyze_issue(
            complaint_text=request.original_input,
            location_text=location_text,
            categories=categories,
        )

        # If citizen did not separately provide a location,
        # use the location extracted by AI.
        if not location_text:

            location_text = issue_analysis.get(
                "location_text"
            )

        # =====================================================
        # 4.1 AI SEVERITY / ATTENTION ANALYSIS
        # =====================================================

        severity = analyze_severity(
            complaint_text=request.original_input,
            issue_analysis=issue_analysis,
        )

        # =====================================================
        # 5. FIND CATEGORY
        # =====================================================

        category_name = issue_analysis.get(
            "issue_category"
        )

        category = None

        if category_name:

            category = (
                self.issue_repository
                .get_category_by_name(
                    category_name
                )
            )

        category_id = (
            category["id"]
            if category
            else None
        )

        # =====================================================
        # 5.1 AI AUTHORITY ROUTING
        # =====================================================

        authority_routing = route_complaint_to_authority(
            complaint_text=request.original_input,
            issue_analysis=issue_analysis,
            severity=severity,
            issue_category_id=category_id,
            jurisdiction_id=None,
        )

        # =====================================================
        # 6. CREATE COMPLAINT
        # =====================================================

        complaint_data = {

            "citizen_id":
                citizen["id"],

            "original_input":
                request.original_input,

            "input_type":
                request.input_type,

            "detected_language":
                relevance.get(
                    "detected_language"
                ),

            "input_language_code":
                relevance.get(
                    "language_code"
                ),

            "normalized_text":
                issue_analysis.get(
                    "normalized_text"
                ),

            "output_language":
                request.output_language
                or relevance.get(
                    "language_code"
                ),

            "relevance":
                "relevant",

            "relevance_score":
                relevance.get(
                    "relevance_score"
                ),

            "relevance_reason":
                relevance.get(
                    "reason"
                ),

            "extracted_information":
                {
                    "issue_analysis":
                        issue_analysis,

                    "severity":
                        severity,

                    "authority_routing":
                        authority_routing,
                },

            "location_text":
                location_text,

            "latitude":
                latitude,

            "longitude":
                longitude,

            "issue_category_id":
                category_id,

            "severity_score":
                severity.get(
                    "severity_score"
                ),

            "severity_level":
                severity.get(
                    "severity_level"
                ),

            "severity_explanation":
                severity.get(
                    "severity_explanation"
                ),

            "status":
                "under_review",

            "is_new_issue":
                True,

            "is_supporting_existing_issue":
                False,
        }

        complaint = (
            self.complaint_repository
            .create_complaint(
                complaint_data
            )
        )

        # =====================================================
        # 7. FIND EXISTING CIVIC ISSUES
        # =====================================================

        existing_issues = (
            self.issue_repository
            .get_open_issues(
                category_id
            )
        )

        duplicate = find_duplicate_issue(
            issue_analysis,
            existing_issues,
        )

        # =====================================================
        # 8. EXISTING ISSUE FOUND
        # =====================================================

        if duplicate:

            existing_issue = duplicate[
                "existing_issue"
            ]

            updated_complaint = (
                self.issue_repository
                .link_complaint_to_issue(

                    complaint_id=
                        complaint["id"],

                    issue_id=
                        existing_issue["id"],

                    issue_category_id=
                        category_id,

                    is_new_issue=False,

                    is_supporting_existing_issue=True,
                )
            )

            return {

                "accepted":
                    True,

                "complaint":
                    updated_complaint,

                "citizen":
                    citizen,

                "relevance":
                    relevance,

                "issue_analysis":
                    issue_analysis,

                "severity":
                    severity,

                "authority_routing":
                    authority_routing,

                "civic_issue":
                    existing_issue,

                "duplicate":
                    duplicate,

                "is_new_issue":
                    False,

                "is_supporting_existing_issue":
                    True,
            }

        # =====================================================
        # 9. CREATE NEW CIVIC ISSUE
        # =====================================================

        issue_data = {

            "issue_category_id":
                category_id,

            "title":
                issue_analysis.get(
                    "issue_summary"
                )
                or "Civic Issue",

            "description":
                issue_analysis.get(
                    "problem"
                ),

            "normalized_issue":
                issue_analysis.get(
                    "normalized_text"
                ),

            "location_text":
                location_text,

            "latitude":
                latitude,

            "longitude":
                longitude,

            "severity_score":
                severity.get(
                    "severity_score"
                ),

            "severity_level":
                severity.get(
                    "severity_level"
                ),

            "status":
                "processing",

            "metadata":
                {
                    "requested_action":
                        issue_analysis.get(
                            "requested_action"
                        ),

                    "key_facts":
                        issue_analysis.get(
                            "key_facts",
                            []
                        ),

                    "missing_information":
                        issue_analysis.get(
                            "missing_information",
                            []
                        ),

                    "severity_explanation":
                        severity.get(
                            "severity_explanation"
                        ),

                    "risk_factors":
                        severity.get(
                            "risk_factors",
                            []
                        ),

                    "authority_routing":
                        authority_routing,
                },
        }

        civic_issue = (
            self.issue_repository
            .create_issue(
                issue_data
            )
        )

        # =====================================================
        # 10. LINK COMPLAINT TO NEW CIVIC ISSUE
        # =====================================================

        updated_complaint = (
            self.issue_repository
            .link_complaint_to_issue(

                complaint_id=
                    complaint["id"],

                issue_id=
                    civic_issue["id"],

                issue_category_id=
                    category_id,

                is_new_issue=True,

                is_supporting_existing_issue=False,
            )
        )

        # =====================================================
        # 11. RETURN COMPLETE RESULT
        # =====================================================

        return {

            "accepted":
                True,

            "complaint":
                updated_complaint,

            "citizen":
                citizen,

            "relevance":
                relevance,

            "issue_analysis":
                issue_analysis,

            "severity":
                severity,

            "authority_routing":
                authority_routing,

            "civic_issue":
                civic_issue,

            "duplicate":
                None,

            "is_new_issue":
                True,

            "is_supporting_existing_issue":
                False,
        }