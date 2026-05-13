from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models import IngestRequest, IngestResponse, FileIngestResponse
from app.services.retriever import hybrid_retriever
import fitz  # PyMuPDF - for PDF
from docx import Document  # for DOCX
import io
router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest):
    try:
        metas = req.metadata or [{} for _ in req.texts]
        hybrid_retriever.add_documents(req.texts, metas)
        return IngestResponse(message="Documents ingested successfully", chunks_stored=len(req.texts))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest):
    try:
        metas = req.metadata or [{} for _ in req.texts]
        hybrid_retriever.add_documents(req.texts, metas)
        return IngestResponse(message="Documents ingested successfully", chunks_stored=len(req.texts))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# NAYA ENDPOINT — file upload ke liye
@router.post("/ingest/file", response_model=FileIngestResponse)
async def ingest_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename = file.filename
        text = ""

        # PDF handle karo
        if filename.endswith(".pdf"):
            pdf = fitz.open(stream=content, filetype="pdf")
            for page in pdf:
                text += page.get_text()

        # DOCX handle karo
        elif filename.endswith(".docx"):
            doc = Document(io.BytesIO(content))
            for para in doc.paragraphs:
                text += para.text + "\n"

        # TXT handle karo
        elif filename.endswith(".txt"):
            text = content.decode("utf-8")

        else:
            raise HTTPException(status_code=400, detail="Sirf PDF, DOCX, TXT supported hai")

        # Text ko chunks mein todo (500 words each)
        words = text.split()
        chunks = [" ".join(words[i:i+500]) for i in range(0, len(words), 500)]
        chunks = [c for c in chunks if c.strip()]  # empty chunks hatao

        metas = [{"source": filename, "chunk": i} for i in range(len(chunks))]
        hybrid_retriever.add_documents(chunks, metas)

        return FileIngestResponse(
            message="File ingested successfully",
            chunks_stored=len(chunks),
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))