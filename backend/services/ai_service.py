from groq import Groq

from config import GROQ_API_KEY, GROQ_MODEL


if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not configured")


client = Groq(api_key=GROQ_API_KEY)


def ask_llm(prompt: str) -> str:
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content