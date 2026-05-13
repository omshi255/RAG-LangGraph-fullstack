import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    GROQ_API_KEY:         str   = os.getenv("GROQ_API_KEY", "")
    COHERE_API_KEY:       str   = os.getenv("COHERE_API_KEY", "")
    PINECONE_API_KEY:     str   = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX:       str   = os.getenv("PINECONE_INDEX", "rag-index")
    PINECONE_REGION:      str   = os.getenv("PINECONE_REGION", "us-east-1")
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))
    MAX_RETRIES:          int   = int(os.getenv("MAX_RETRIES", "3"))
    EMBED_MODEL:          str   = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
    GROQ_MODEL:           str   = os.getenv("GROQ_MODEL", "llama3-8b-8192")
    COHERE_RERANK_MODEL:  str   = os.getenv("COHERE_RERANK_MODEL", "rerank-english-v3.0")
    EMBED_DIM:            int   = 384

settings = Settings()
