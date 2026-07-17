import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.rag_service import rag_service

router = APIRouter()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    length_function=len,
)


# 1. Ingest raw text 
class TextIngestRequest(BaseModel):
    text: str
    source: Optional[str] = "manual_input"

class IngestResponse(BaseModel):
    status: str
    chunks_added: int
    source: str


@router.post("/ingest/text", response_model=IngestResponse)
async def ingest_text(request: TextIngestRequest):
    """
    Ingest raw text directly into the knowledge base.

    Use this to manually add knowledge: paste paragraphs about
    a topic, Q&A pairs, or any text you want the bot to know.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    chunks = text_splitter.split_text(request.text)
    metadatas = [
        {"source": request.source, "chunk_index": i}
        for i in range(len(chunks))
    ]
    rag_service.add_documents(texts=chunks, metadatas=metadatas)

    return IngestResponse(
        status="success",
        chunks_added=len(chunks),
        source=request.source,
    )


#  2. Ingest uploaded file (.txt, .md, .pdf) 
ALLOWED_EXTENSIONS = {".txt", ".md", ".csv", ".json", ".pdf"}


def _extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF using PyPDF2 (lightweight, no external deps)."""
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(file_path)
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PyPDF2 is required for PDF ingestion. "
            "Install it: pip install PyPDF2",
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to read PDF: {e}"
        )


def _process_file(file_path: str, filename: str) -> int:
    """Read file, split into chunks, add to ChromaDB. Returns chunk count."""
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        text = _extract_text_from_pdf(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()

    if not text.strip():
        return 0

    chunks = text_splitter.split_text(text)
    metadatas = [
        {"source": filename, "chunk_index": i}
        for i in range(len(chunks))
    ]
    rag_service.add_documents(texts=chunks, metadatas=metadatas)
    return len(chunks)


@router.post("/ingest/file")
async def ingest_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a file (.txt, .md, .csv, .json, .pdf) and ingest its
    content into the knowledge base.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        chunks_added = _process_file(tmp_path, file.filename)
    finally:
        os.unlink(tmp_path)

    return {
        "status": "success",
        "filename": file.filename,
        "chunks_added": chunks_added,
    }


# 3. Bulk ingest multiple texts at once 
class BulkIngestRequest(BaseModel):
    documents: List[str]
    source: Optional[str] = "bulk_input"


@router.post("/ingest/bulk")
async def ingest_bulk(request: BulkIngestRequest):
    """
    Ingest multiple text passages at once.
    Useful for seeding the knowledge base with structured data
    (e.g., a list of facts about Indian states, GK entries, etc.).
    """
    if not request.documents:
        raise HTTPException(status_code=400, detail="Documents list cannot be empty")

    total_chunks = 0
    for i, doc_text in enumerate(request.documents):
        if not doc_text.strip():
            continue
        chunks = text_splitter.split_text(doc_text)
        metadatas = [
            {"source": f"{request.source}:doc_{i}", "chunk_index": j}
            for j in range(len(chunks))
        ]
        rag_service.add_documents(texts=chunks, metadatas=metadatas)
        total_chunks += len(chunks)

    return {
        "status": "success",
        "documents_processed": len(request.documents),
        "total_chunks_added": total_chunks,
        "source": request.source,
    }