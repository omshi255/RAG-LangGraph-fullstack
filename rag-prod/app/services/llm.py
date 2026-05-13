from groq import Groq
from app.config import settings

class LLMService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def chat(self, system: str, user: str, temperature: float = 0.0) -> str:
        resp = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user}
            ],
            temperature=temperature,
            max_tokens=1024
        )
        return resp.choices[0].message.content.strip()

llm = LLMService()
