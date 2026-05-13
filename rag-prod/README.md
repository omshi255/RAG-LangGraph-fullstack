# RAG Agent v2 — Production LangGraph + Pinecone

## Stack
- **LangGraph** — stateful pipeline orchestration
- **Pinecone** — cloud vector database (replaces ChromaDB)
- **Groq** — ultra-fast LLM inference (llama3-8b-8192, free tier)
- **Cohere** — neural reranker (free tier: 1000 calls/month)
- **Sentence Transformers** — embeddings (all-MiniLM-L6-v2, runs locally, free)
- **FastAPI** — REST API

---

## Pipeline Flow

```
POST /api/query
      │
      ▼
Semantic Cache ──hit──► END (cached:true)
      │ miss
      ▼
Query Rewriter (HyDE + step-back)
      │
      ▼
Hybrid Retriever (Pinecone dense + BM25 sparse → top 20)
      │
      ▼
Cohere Reranker (top 20 → top 5)
      │
      ▼
Groq LLM Generate
      │
      ▼
Hallucination Grader ──► Answer Grader ──► Router
      │                                      │
      ├── both pass ──────────────────► Finalize → cache → END
      ├── hallucination fail ────────► Regenerate → Generate (loop)
      └── answer fail ───────────────► Rewrite+Retrieve → Generate (loop)
                                        (max 3 retries then force finalize)
```

---

## Step 1 — Get API Keys (all free)

| Service | URL | Free Tier |
|---------|-----|-----------|
| Groq | https://console.groq.com | Generous free tier |
| Cohere | https://dashboard.cohere.com | 1000 reranks/month |
| Pinecone | https://app.pinecone.io | 1 free index, 2GB storage |

---

## Step 2 — Setup

```bash
# Clone / unzip the project
cd rag-agent-v2

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

## Step 3 — Configure .env

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and fill in your real keys:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX=rag-index
PINECONE_REGION=us-east-1
```

> **Pinecone Region:** When you create an account, use `us-east-1` (AWS).
> If you pick a different region, update `PINECONE_REGION` accordingly.

---

## Step 4 — Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
⏳ Loading model: all-MiniLM-L6-v2
✅ Embedder ready
✅ Pinecone index 'rag-index' created   (first run only)
✅ HybridRetriever ready
✅ Semantic cache ready
INFO: Uvicorn running on http://0.0.0.0:8000
```

---

## Step 5 — Test with Postman

1. Open Postman
2. Click **Import** → select `rag_agent_v2.postman_collection.json`
3. Run requests **in order**:
   - `1. Health Check` → should return `{"status":"ok"}`
   - `2. Ingest Documents` → ingests 8 sample documents
   - `3. Query - What is LangGraph?` → get an answer
   - `4. Query - How does RAG work?`
   - `5. Query - What is Pinecone?`
   - `6. Query - Cache Test` → same query as #3, should return `"cached": true`

---

## API Reference

### POST /api/ingest
```json
{
  "texts": ["Your text chunk 1", "Your text chunk 2"],
  "metadata": [{"source": "doc1"}, {"source": "doc2"}]
}
```
Response:
```json
{"message": "Documents ingested successfully", "chunks_stored": 2}
```

### POST /api/query
```json
{
  "query": "What is LangGraph?",
  "top_k": 5
}
```
Response:
```json
{
  "answer": "LangGraph is... [1]",
  "sources": [{"text": "...", "score": 0.92}],
  "cached": false,
  "retries": 0
}
```

### GET /health
```json
{"status": "ok", "service": "RAG Agent v2"}
```

---

## Project Structure

```
rag-agent-v2/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # All settings from .env
│   ├── models.py            # Pydantic request/response schemas
│   ├── graph/
│   │   ├── state.py         # LangGraph GraphState TypedDict
│   │   ├── nodes.py         # All node functions (10 nodes)
│   │   └── graph.py         # Graph wiring + conditional edges
│   ├── routes/
│   │   ├── ingest.py        # POST /api/ingest
│   │   └── query.py         # POST /api/query
│   └── services/
│       ├── embedder.py      # Sentence Transformers
│       ├── retriever.py     # Pinecone + BM25 hybrid
│       ├── reranker.py      # Cohere reranker
│       ├── cache.py         # In-memory semantic cache
│       ├── llm.py           # Groq LLM wrapper
│       └── graders.py       # Hallucination + answer graders
├── requirements.txt
├── .env.example
└── rag_agent_v2.postman_collection.json
```

---

## Common Issues

**`AuthenticationError`** — API key missing or wrong in `.env`

**`PineconeApiException`** — Wrong region in `.env`, or index name has uppercase letters (use lowercase only)

**`ModuleNotFoundError`** — Run `pip install -r requirements.txt` again inside the venv

**First query is slow** — Sentence Transformer model downloads on first run (~90MB), cached after that







