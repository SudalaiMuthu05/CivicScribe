from dotenv import load_dotenv
import os

load_dotenv()

APP_NAME = os.getenv(
    "APP_NAME",
    "The Grievance Scribe"
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")