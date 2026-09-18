from typing import Any

from database.supabase_client import supabase


class CitizenRepository:
    """Database operations related to citizens."""

    TABLE_NAME = "citizens"

    def create_citizen(
        self,
        name: str,
        phone_number: str | None = None,
        email: str | None = None,
        telegram_chat_id: str | None = None,
        preferred_language: str | None = None,
        preferred_input_language: str | None = None,
    ) -> dict[str, Any]:

        data = {
            "name": name,
            "phone_number": phone_number,
            "email": email,
            "telegram_chat_id": telegram_chat_id,
            "preferred_language": preferred_language,
            "preferred_input_language": preferred_input_language,
        }

        response = (
            supabase
            .table(self.TABLE_NAME)
            .insert(data)
            .execute()
        )

        if not response.data:
            raise RuntimeError("Failed to create citizen.")

        return response.data[0]

    def get_citizen(
        self,
        citizen_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("id", citizen_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def find_by_phone(
        self,
        phone_number: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("phone_number", phone_number)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def find_by_telegram(
        self,
        telegram_chat_id: str,
    ) -> dict[str, Any] | None:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .select("*")
            .eq("telegram_chat_id", telegram_chat_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def update_citizen(
        self,
        citizen_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase
            .table(self.TABLE_NAME)
            .update(updates)
            .eq("id", citizen_id)
            .execute()
        )

        if not response.data:
            raise RuntimeError(
                f"Citizen {citizen_id} could not be updated."
            )

        return response.data[0]