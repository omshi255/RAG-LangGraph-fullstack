from pydantic import BaseModel
from typing import List, Optional

class IngestRequest(BaseModel):
    texts: List[str]
    metadata: Optional[List[dict]] = None

class IngestResponse(BaseModel):
    message: str
    chunks_stored: int

class QueryRequest(BaseModel):
    query: str
    top_k: int = 5

class Source(BaseModel):
    text: str
    score: float

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    cached: bool = False
    retries: int = 0

# Existing models ke neeche add karo
class FileIngestResponse(BaseModel):
    message: str
    chunks_stored: int
    filename: str