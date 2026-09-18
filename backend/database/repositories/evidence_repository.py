from typing import Any

from database.supabase_client import supabase


class EvidenceRepository:

    TABLE_NAME = "evidence"

    # =========================================================
    # CREATE EVIDENCE
    # =========================================================

    def create_evidence(
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
                "Failed to create evidence record."
            )

        return response.data[0]

    # =========================================================
    # GET EVIDENCE
    # =========================================================

    def get_evidence(
        self,
        evidence_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("id", evidence_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # =========================================================
    # GET COMPLAINT EVIDENCE
    # =========================================================

    def get_complaint_evidence(
        self,
        complaint_id: str,
    ) -> list[dict[str, Any]]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("complaint_id", complaint_id)
            .order("created_at", desc=False)
            .execute()
        )

        return response.data or []

    # =========================================================
    # GET BY CLOUDINARY PUBLIC ID
    # =========================================================

    def get_by_cloudinary_public_id(
        self,
        public_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq(
                "cloudinary_public_id",
                public_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # =========================================================
    # UPDATE EVIDENCE
    # =========================================================

    def update_evidence(
        self,
        evidence_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .update(updates)
            .eq("id", evidence_id)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                "Failed to update evidence record."
            )

        return response.data[0]

    # =========================================================
    # DELETE EVIDENCE
    # =========================================================

    def delete_evidence(
        self,
        evidence_id: str,
    ) -> bool:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .delete()
            .eq("id", evidence_id)
            .execute()
        )

        return bool(response.data)