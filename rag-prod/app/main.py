from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ingest import router as ingest_router
from app.routes.query  import router as query_router

app = FastAPI(
    title="Production RAG Agent",
    description="Pinecone + LangGraph + Groq + Cohere — Full RAG Pipeline",
    version="2.0.0"
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(ingest_router, prefix="/api")
app.include_router(query_router,  prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "service": "RAG Agent v2"}
