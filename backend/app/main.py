from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.scheduler import start_scheduler
from app.database.connection import engine, Base
import app.models.log  # Import models so Base knows about them

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    print("Starting up the FastAPI backend...")
    
    #  SQLite database tables
    Base.metadata.create_all(bind=engine)
    print("SQLite database tables created.")
    
    start_scheduler()
    yield
   
    print("Shutting down the FastAPI backend...")

app = FastAPI(
    title="Rasa + RAG + Ollama Backend API",
    description="Backend orchestration for AI chatbot pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

from app.api.endpoints import chat, crawl
app.include_router(chat.router, prefix="/api/v1")
app.include_router(crawl.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Backend API is running!"}

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Chatbot Backend Pipeline. See /docs for API documentation."}
