from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.scheduler import start_scheduler
from app.database.connection import engine, Base
from app.services.rasa_service import rasa_service
import app.models.log  # Import models so Base knows about them


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up the FastAPI backend...")

    # Create SQLite database tables
    Base.metadata.create_all(bind=engine)
    print("SQLite database tables created.")

    start_scheduler()

    # Surface a missing/untrained Rasa model at startup instead of failing silently.
    # (In Docker, Rasa may still be training here; /health shows the live status.)
    rasa = await rasa_service.status()
    if rasa["ok"]:
        print(f"Rasa NLU ready (model: {rasa['model']}).")
    else:
        print(
            "WARNING: Rasa NLU not ready yet "
            f"({rasa['error']}). Messages go to the LLM until Rasa is up. "
            "Run `rasa train` then `rasa run --enable-api`."
        )
    yield

    print("Shutting down the FastAPI backend...")


app = FastAPI(
    title="Rasa + RAG + Ollama Backend API",
    description="Backend orchestration for AI chatbot pipeline with "
    "confidence-based routing, RAG scoring, conversation memory, "
    "streaming responses, and document ingestion.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev servers to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers 
from app.api.endpoints import chat, crawl, ingest

app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(crawl.router, prefix="/api/v1", tags=["Crawl"])
app.include_router(ingest.router, prefix="/api/v1", tags=["Ingest"])


@app.get("/health")
async def health_check():
    rasa = await rasa_service.status()
    return {
        "status": "ok",
        "service": "Backend API v2.0 is running!",
        "rasa": "ok" if rasa["ok"] else "unavailable",
        "rasa_model": rasa["model"],
        "rasa_error": rasa["error"],
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to the AI Chatbot Backend Pipeline v2.0. "
        "See /docs for API documentation."
    }