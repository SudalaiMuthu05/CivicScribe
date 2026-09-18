from functools import lru_cache
from typing import Any

from groq import Groq

from config.settings import settings


@lru_cache
def get_groq_client() -> Groq:
    """
    Create and cache the Groq client.
    """

    if not settings.groq_api_key:
        raise ValueError(
            "GROQ_API_KEY is not configured."
        )

    return Groq(
        api_key=settings.groq_api_key
    )


groq_client = get_groq_client()


def generate_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.0,
) -> str:
    """
    Generate a response using the configured Groq model.
    """

    response = groq_client.chat.completions.create(
        model=settings.groq_model,
        temperature=temperature,
        messages=[
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
    )

    return response.choices[0].message.content or ""