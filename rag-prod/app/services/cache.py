import numpy as np
from app.services.embedder import embedder
from app.config import settings

class SemanticCache:
    def __init__(self):
        self.store = {}
        print("✅ Semantic cache ready (in-memory)")

    def _cosine(self, a, b):
        a, b = np.array(a), np.array(b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))

    def get(self, query: str):
        q_vec = embedder.embed_one(query)
        for entry in self.store.values():
            if self._cosine(q_vec, entry["vector"]) >= settings.SIMILARITY_THRESHOLD:
                print("✅ Cache HIT")
                return entry["answer"]
        return None

    def set(self, query: str, answer: str):
        q_vec = embedder.embed_one(query)
        self.store[hash(query)] = {"vector": q_vec, "answer": answer}

semantic_cache = SemanticCache()
