from typing import Any

from database.supabase_client import supabase


class IssueRepository:

    def get_categories(self) -> list[dict[str, Any]]:
        response = (
            supabase
            .table("issue_categories")
            .select("*")
            .eq("is_active", True)
            .execute()
        )

        return response.data or []

    def get_category_by_name(
        self,
        category_name: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table("issue_categories")
            .select("*")
            .ilike("name", category_name)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def get_open_issues(
        self,
        category_id: str | None = None,
    ) -> list[dict[str, Any]]:

        query = (
            supabase
            .table("civic_issues")
            .select("*")
        )

        if category_id:
            query = query.eq(
                "issue_category_id",
                category_id,
            )

        response = query.execute()

        return response.data or []

    def create_issue(
        self,
        data: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase
            .table("civic_issues")
            .insert(data)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Failed to create civic issue."
            )

        return response.data[0]

    def get_issue(
        self,
        issue_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table("civic_issues")
            .select("*")
            .eq("id", issue_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def link_complaint_to_issue(
        self,
        complaint_id: str,
        issue_id: str,
        issue_category_id: str | None = None,
        is_new_issue: bool = False,
        is_supporting_existing_issue: bool = True,
    ) -> dict[str, Any]:

        updates = {
            "civic_issue_id": issue_id,
            "is_new_issue": is_new_issue,
            "is_supporting_existing_issue": (
                is_supporting_existing_issue
            ),
        }

        if issue_category_id:
            updates["issue_category_id"] = issue_category_id

        response = (
            supabase
            .table("complaints")
            .update(updates)
            .eq("id", complaint_id)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Failed to link complaint to civic issue."
            )

        return response.data[0]