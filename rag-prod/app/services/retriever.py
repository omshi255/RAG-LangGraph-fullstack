from pinecone import Pinecone, ServerlessSpec
from rank_bm25 import BM25Okapi
from app.config import settings
from app.services.embedder import embedder

class HybridRetriever:
    def __init__(self):
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)

        # Create index if it doesn't exist
        existing = [i.name for i in pc.list_indexes()]
        if settings.PINECONE_INDEX not in existing:
            pc.create_index(
                name=settings.PINECONE_INDEX,
                dimension=settings.EMBED_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=settings.PINECONE_REGION)
            )
            print(f"✅ Pinecone index '{settings.PINECONE_INDEX}' created")

        self.index = pc.Index(settings.PINECONE_INDEX)
        self._docs: list[str] = []
        self._bm25 = None
        self._load_bm25_from_pinecone()
        print("✅ HybridRetriever ready")

    def _load_bm25_from_pinecone(self):
        """Reload existing docs from Pinecone into BM25 on startup."""
        try:
            stats = self.index.describe_index_stats()
            total = stats.total_vector_count
            if total == 0:
                return
            # Fetch sample to rebuild BM25 (Pinecone doesn't support full scan easily)
            # We store docs in metadata — fetch up to 10000 via dummy query
            dummy = embedder.embed_one("a")
            res = self.index.query(vector=dummy, top_k=min(total, 10000), include_metadata=True)
            self._docs = [m.metadata.get("text", "") for m in res.matches if m.metadata]
            if self._docs:
                self._bm25 = BM25Okapi([t.split() for t in self._docs])
                print(f"✅ BM25 rebuilt: {len(self._docs)} docs from Pinecone")
        except Exception as e:
            print(f"⚠️ BM25 reload skipped: {e}")

    def add_documents(self, texts: list[str], metadatas: list[dict] = None):
        vectors = embedder.embed(texts)
        metas = metadatas or [{} for _ in texts]

        upserts = []
        for i, (text, vec, meta) in enumerate(zip(texts, vectors, metas)):
            meta["text"] = text
            upserts.append({
                "id": f"doc_{abs(hash(text))}",
                "values": vec,
                "metadata": meta
            })

        self.index.upsert(vectors=upserts)
        self._docs += texts
        self._bm25 = BM25Okapi([t.split() for t in self._docs])
        print(f"✅ {len(texts)} docs upserted. Total BM25: {len(self._docs)}")

    def retrieve(self, query: str, top_k: int = 20) -> list[dict]:
        q_vec = embedder.embed_one(query)
        stats = self.index.describe_index_stats()
        if stats.total_vector_count == 0:
            return []

        # Dense retrieval from Pinecone
        res = self.index.query(
            vector=q_vec,
            top_k=min(top_k, stats.total_vector_count),
            include_metadata=True
        )
        dense_docs = [
            {"text": m.metadata.get("text", ""), "score": float(m.score)}
            for m in res.matches if m.metadata
        ]

        # Sparse retrieval from BM25
        sparse_docs = []
        if self._bm25 and self._docs:
            scores = self._bm25.get_scores(query.split())
            top_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
            sparse_docs = [{"text": self._docs[i], "score": float(scores[i])} for i in top_idx]

        # Merge + dedup (dense first)
        seen, merged = set(), []
        for item in dense_docs:
            if item["text"] not in seen:
                seen.add(item["text"])
                merged.append(item)
        for item in sparse_docs:
            if item["text"] not in seen:
                seen.add(item["text"])
                merged.append(item)

        return merged[:top_k]

hybrid_retriever = HybridRetriever()
