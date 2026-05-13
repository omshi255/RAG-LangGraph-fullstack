from sentence_transformers import SentenceTransformer
from app.config import settings

class Embedder:
    def __init__(self):
        print(f"⏳ Loading model: {settings.EMBED_MODEL}")
        self.model = SentenceTransformer(settings.EMBED_MODEL)
        print("✅ Embedder ready")

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [v.tolist() for v in self.model.encode(texts, show_progress_bar=False)]

    def embed_one(self, text: str) -> list[float]:
        return self.model.encode([text], show_progress_bar=False)[0].tolist()

embedder = Embedder()
