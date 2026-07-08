"""Custom actions for the Rasa assistant.

`action_query_knowledge_base` first tries an external RAG endpoint
(e.g. a FastAPI micro-service backed by Qdrant / hybrid retrieval).
If the endpoint is unreachable or not configured, it falls back to a
simple local keyword lookup so the bot still works out of the box.

Configure the RAG endpoint via environment variable:
    export RAG_ENDPOINT="http://localhost:8000/query"
Expected contract:  POST {"query": "<user text>"}  ->  {"answer": "<text>"}
"""

import logging
import os
from typing import Any, Dict, List, Optional, Text

import requests
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

logger = logging.getLogger(__name__)

RAG_ENDPOINT = os.getenv("RAG_ENDPOINT", "")
RAG_TIMEOUT_SECONDS = float(os.getenv("RAG_TIMEOUT_SECONDS", "8"))

# Minimal built-in knowledge base used when no RAG endpoint is configured.
LOCAL_KB: Dict[str, str] = {
    "refund": "Refunds are processed within 5-7 business days after the return is approved.",
    "onboarding": "Onboarding has three steps: account creation, profile verification, and a guided product tour.",
    "api": "The default API rate limit is 60 requests per minute per key. Contact support to raise it.",
    "leave": "Leave requests must be submitted at least 3 working days in advance through the HR portal.",
    "security": "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Access follows least-privilege policy.",
    "deployment": "Deployments run through the CI pipeline: tests, staging approval, then production rollout.",
    "complaint": "To file a complaint, email support@example.com with the subject 'Complaint' and your reference ID.",
}


def _query_rag(user_message: Text) -> Optional[Text]:
    """Call the external RAG service. Returns None on any failure."""
    if not RAG_ENDPOINT:
        return None
    try:
        resp = requests.post(
            RAG_ENDPOINT,
            json={"query": user_message},
            timeout=RAG_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        answer = resp.json().get("answer")
        return answer if isinstance(answer, str) and answer.strip() else None
    except requests.RequestException as exc:
        logger.warning("RAG endpoint failed: %s", exc)
        return None


def _query_local_kb(user_message: Text) -> Optional[Text]:
    """Very simple keyword match against the built-in KB."""
    lowered = user_message.lower()
    for keyword, answer in LOCAL_KB.items():
        if keyword in lowered:
            return answer
    return None


class ActionQueryKnowledgeBase(Action):
    def name(self) -> Text:
        return "action_query_knowledge_base"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        user_message = tracker.latest_message.get("text", "") or ""

        answer = _query_rag(user_message) or _query_local_kb(user_message)

        if answer:
            dispatcher.utter_message(text=answer)
        else:
            dispatcher.utter_message(response="utter_ask_rephrase")
        return []


class ActionDefaultFallback(Action):
    def name(self) -> Text:
        return "action_default_fallback"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(response="utter_ask_rephrase")
        return []
