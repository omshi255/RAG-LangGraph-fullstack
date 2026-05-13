from app.services.cache import semantic_cache
from app.services.retriever import hybrid_retriever
from app.services.reranker import reranker
from app.services.llm import llm
from app.services.graders import hallucination_grader, answer_grader
from app.graph.state import GraphState


def node_semantic_cache(state: GraphState) -> dict:
    hit = semantic_cache.get(state["query"])
    if hit:
        return {"answer": hit, "cached": True, "documents": []}
    return {"cached": False}


def node_query_rewriter(state: GraphState) -> dict:
    system = (
        "Rewrite the user query to be more specific and retrieval-friendly. "
        "Use step-back prompting. Return only the rewritten query."
    )
    return {"rewritten_query": llm.chat(system, state["query"])}


def node_hybrid_retriever(state: GraphState) -> dict:
    query = state.get("rewritten_query") or state["query"]
    return {"documents": hybrid_retriever.retrieve(query, top_k=20)}


def node_reranker(state: GraphState) -> dict:
    query = state.get("rewritten_query") or state["query"]
    top = reranker.rerank(query, state["documents"], top_n=state.get("top_k", 5))
    return {"documents": top}


def node_generate(state: GraphState) -> dict:
    context = "\n\n".join([f"[{i+1}] {d['text']}" for i, d in enumerate(state["documents"])])
    system = (
        "Answer using ONLY the provided context. "
        "Cite sources as [1],[2] etc. If context is insufficient, say so."
    )
    answer = llm.chat(system, f"CONTEXT:\n{context}\n\nQUESTION:\n{state['query']}", temperature=0.1)
    return {"answer": answer}


def node_hallucination_grader(state: GraphState) -> dict:
    chunks = [d["text"] for d in state["documents"]]
    return {"hallucination_pass": hallucination_grader.grade(state["answer"], chunks)}


def node_answer_grader(state: GraphState) -> dict:
    return {"answer_pass": answer_grader.grade(state["query"], state["answer"])}


def node_grader_router(state: GraphState) -> dict:
    """Passthrough — conditional edge on this node does the routing."""
    return {}


def node_finalize(state: GraphState) -> dict:
    if not state.get("cached"):
        semantic_cache.set(state["query"], state["answer"])
    return {}


def node_regenerate(state: GraphState) -> dict:
    context = "\n\n".join([f"[{i+1}] {d['text']}" for i, d in enumerate(state["documents"])])
    system = (
        "Answer using ONLY the context. No outside knowledge. "
        "Cite every claim with [source number]."
    )
    answer = llm.chat(system, f"CONTEXT:\n{context}\n\nQUESTION:\n{state['query']}", temperature=0.0)
    return {"answer": answer, "retries": state.get("retries", 0) + 1}


def node_rewrite_and_retrieve(state: GraphState) -> dict:
    system = (
        "The previous answer did not address the question. "
        "Rewrite the question more specifically. Return only the rewritten question."
    )
    new_query = llm.chat(system, state["query"])
    docs = hybrid_retriever.retrieve(new_query, top_k=20)
    top  = reranker.rerank(new_query, docs, top_n=state.get("top_k", 5))
    return {
        "rewritten_query": new_query,
        "documents": top,
        "retries": state.get("retries", 0) + 1
    }
