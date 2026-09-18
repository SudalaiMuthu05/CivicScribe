from functools import lru_cache

from supabase import Client, create_client

from config.settings import settings


@lru_cache
def get_supabase_client() -> Client:
    """
    Create and cache a Supabase client.

    Credentials are loaded from the environment
    through the application settings.
    """

    if not settings.supabase_url:
        raise ValueError("SUPABASE_URL is not configured.")

    if not settings.supabase_key:
        raise ValueError("SUPABASE_KEY is not configured.")

    return create_client(
        settings.supabase_url,
        settings.supabase_key,
    )


supabase: Client = get_supabase_client()