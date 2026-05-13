from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.nodes import (
    node_semantic_cache, node_query_rewriter, node_hybrid_retriever,
    node_reranker, node_generate, node_hallucination_grader,
    node_answer_grader, node_grader_router, node_finalize,
    node_regenerate, node_rewrite_and_retrieve
)
from app.config import settings


def route_after_cache(state: GraphState) -> str:
    return "end_cached" if state.get("cached") else "query_rewriter"


def route_after_graders(state: GraphState) -> str:
    if state.get("retries", 0) >= settings.MAX_RETRIES:
        return "finalize"
    if not state.get("hallucination_pass"):
        return "regenerate"
    if not state.get("answer_pass"):
        return "rewrite_retrieve"
    return "finalize"


def build_graph():
    g = StateGraph(GraphState)

    g.add_node("semantic_cache",       node_semantic_cache)
    g.add_node("query_rewriter",       node_query_rewriter)
    g.add_node("hybrid_retriever",     node_hybrid_retriever)
    g.add_node("reranker",             node_reranker)
    g.add_node("generate",             node_generate)
    g.add_node("hallucination_grader", node_hallucination_grader)
    g.add_node("answer_grader",        node_answer_grader)
    g.add_node("grader_router",        node_grader_router)
    g.add_node("finalize",             node_finalize)
    g.add_node("regenerate",           node_regenerate)
    g.add_node("rewrite_retrieve",     node_rewrite_and_retrieve)

    g.set_entry_point("semantic_cache")

    # Flow 1
    g.add_conditional_edges("semantic_cache", route_after_cache, {
        "end_cached":    END,
        "query_rewriter": "query_rewriter"
    })
    g.add_edge("query_rewriter",   "hybrid_retriever")
    g.add_edge("hybrid_retriever", "reranker")
    g.add_edge("reranker",         "generate")

    # Flow 2 — sequential grading
    g.add_edge("generate",             "hallucination_grader")
    g.add_edge("hallucination_grader", "answer_grader")
    g.add_edge("answer_grader",        "grader_router")

    g.add_conditional_edges("grader_router", route_after_graders, {
        "finalize":         "finalize",
        "regenerate":       "regenerate",
        "rewrite_retrieve": "rewrite_retrieve"
    })

    # FIX: both recovery paths go back to generate
    g.add_edge("regenerate",       "generate")
    g.add_edge("rewrite_retrieve", "generate")
    g.add_edge("finalize",         END)

    return g.compile()


rag_graph = build_graph()
