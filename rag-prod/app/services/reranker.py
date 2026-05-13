import cohere
from app.config import settings

class Reranker:
    def __init__(self):
        self.client = cohere.Client(settings.COHERE_API_KEY)

    def rerank(self, query: str, docs: list[dict], top_n: int = 5) -> list[dict]:
        if not docs:
            return []
        texts = [d["text"] for d in docs]
        try:
            resp = self.client.rerank(
                model=settings.COHERE_RERANK_MODEL,
                query=query,
                documents=texts,
                top_n=top_n
            )
            return [{"text": texts[r.index], "score": r.relevance_score} for r in resp.results]
        except Exception as e:
            print(f"⚠️ Reranker fallback: {e}")
            return sorted(docs, key=lambda x: x["score"], reverse=True)[:top_n]

reranker = Reranker()
