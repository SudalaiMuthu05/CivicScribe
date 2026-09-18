from typing import Any

from database.supabase_client import supabase


class ComplaintRepository:
    """Database operations related to complaints."""

    TABLE_NAME = "complaints"

    def create_complaint(
        self,
        data: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .insert(data)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Failed to create complaint."
            )

        return response.data[0]

    def get_complaint(
        self,
        complaint_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("id", complaint_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def get_by_complaint_number(
        self,
        complaint_number: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("complaint_number", complaint_number)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def get_citizen_complaints(
        self,
        citizen_id: str,
    ) -> list[dict[str, Any]]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("citizen_id", citizen_id)
            .order("created_at", desc=True)
            .execute()
        )

        return response.data or []

    def update_complaint(
        self,
        complaint_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .update(updates)
            .eq("id", complaint_id)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                f"Complaint {complaint_id} could not be updated."
            )

        return response.data[0]

    def delete_complaint(
        self,
        complaint_id: str,
    ) -> bool:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .delete()
            .eq("id", complaint_id)
            .execute()
        )

        return bool(response.data)