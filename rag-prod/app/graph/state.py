from typing import TypedDict, List, Optional

class GraphState(TypedDict):
    query:              str
    rewritten_query:    str
    documents:          List[dict]
    answer:             str
    cached:             bool
    retries:            int
    hallucination_pass: Optional[bool]
    answer_pass:        Optional[bool]
    top_k:              int
