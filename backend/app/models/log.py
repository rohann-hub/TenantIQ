from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime, timezone
from app.database.connection import Base


class ChatLog(Base):
    """Stores every chat interaction for analytics and debugging."""

    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_query = Column(Text, nullable=False)
    detected_intent = Column(String(100), nullable=True)
    confidence_score = Column(Float, default=0.0)
    extracted_entities = Column(Text, default="[]")  # JSON string
    route = Column(String(20), default="llm")  # "rasa" or "llm" — which path handled it
    llm_response = Column(Text, nullable=False)
    session_id = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<ChatLog id={self.id} intent={self.detected_intent} route={self.route}>"
