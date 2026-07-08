from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.rasa_service import rasa_service
from app.services.rag_service import rag_service
from app.services.llm_service import llm_service
from app.services.log_service import log_interaction
from app.database.connection import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    query: str
    intent: Optional[str] = None
    confidence: float = 0.0
    entities: List[Dict[str, Any]] = []
    context: List[str] = []
    final_answer: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint.
    Routes the query to Rasa NLU to extract intent and entities.
    Retrieves semantic context from ChromaDB.
    Feeds everything to Ollama to generate a conversational response.
    Logs the interaction to SQLite.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    #  Intent and Entities from Rasa
    nlu_result = await rasa_service.get_intent_and_entities(request.query)
    intent = nlu_result.get("intent")
    confidence = nlu_result.get("confidence", 0.0)
    entities = nlu_result.get("entities", [])
    
    #  Retrieve Context from ChromaDB
    docs = rag_service.search_similar_documents(request.query, top_k=3)
    context_strings = [doc.page_content for doc in docs]
    
    
    final_answer = llm_service.generate_response(
        query=request.query,
        intent=intent,
        confidence=confidence,
        entities=entities,
        context_strings=context_strings
    )
    
    #  SQLite Database
    log_interaction(
        db=db,
        query=request.query,
        intent=intent or "Unknown",
        confidence=confidence,
        entities=entities,
        response=final_answer
    )
    
    return ChatResponse(
        query=request.query,
        intent=intent,
        confidence=confidence,
        entities=entities,
        context=context_strings,
        final_answer=final_answer
    )
