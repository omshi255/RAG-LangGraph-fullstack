from fastapi import APIRouter, HTTPException
from app.models import QueryRequest, QueryResponse, Source
from app.graph.graph import rag_graph

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        state = {
            "query":              req.query,
            "rewritten_query":    "",
            "documents":          [],
            "answer":             "",
            "cached":             False,
            "retries":            0,
            "hallucination_pass": None,
            "answer_pass":        None,
            "top_k":              req.top_k
        }
        result = rag_graph.invoke(state)
        sources = [Source(text=d["text"], score=d.get("score", 0.0)) for d in result.get("documents", [])]
        return QueryResponse(
            answer=result["answer"],
            sources=sources,
            cached=result.get("cached", False),
            retries=result.get("retries", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
