from sqlalchemy.orm import Session
from app.models.log import ChatLog
import json

def log_interaction(db: Session, query: str, intent: str, confidence: float, entities: list, response: str):
    """
    Saves a single chat interaction to the SQLite database.
    """
    try:
        log_entry = ChatLog(
            user_query=query,
            detected_intent=intent,
            confidence_score=confidence,
            extracted_entities=json.dumps(entities), # Convert list of dicts to string
            llm_response=response
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
    except Exception as e:
        print(f"Failed to log interaction to DB: {e}")
        db.rollback()
