from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY


if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not configured")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is not configured")


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def test_supabase_connection():
    return supabase

def test_supabase_role():
    response = supabase.rpc("get_my_role").execute()
    return response