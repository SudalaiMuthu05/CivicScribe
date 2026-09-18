from typing import Any

from database.supabase_client import supabase


class AuthorityRepository:

    def get_active_authorities(self) -> list[dict[str, Any]]:
        response = (
            supabase
            .table("authorities")
            .select("*")
            .eq("is_active", True)
            .execute()
        )

        return response.data or []

    def get_authority_by_id(
        self,
        authority_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table("authorities")
            .select("*")
            .eq("id", authority_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def get_routing_rules(
        self,
        issue_category_id: str | None = None,
        jurisdiction_id: str | None = None,
    ) -> list[dict[str, Any]]:

        query = (
            supabase
            .table("authority_routing_rules")
            .select("*")
            .eq("is_active", True)
        )

        if issue_category_id:
            query = query.eq(
                "issue_category_id",
                issue_category_id,
            )

        if jurisdiction_id:
            query = query.eq(
                "jurisdiction_id",
                jurisdiction_id,
            )

        response = (
            query
            .order("priority", desc=False)
            .execute()
        )

        return response.data or []