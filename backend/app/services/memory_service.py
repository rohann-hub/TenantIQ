from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import List, Tuple
import threading
import time


@dataclass
class ConversationTurn:
    role: str          # "user" or "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)


class MemoryService:
    """
    Keeps a sliding window of conversation history per session.

    - Thread-safe via a lock
    - Auto-expires sessions after `ttl_seconds` of inactivity
    - Limits each session to `max_turns` turns (oldest dropped first)
    """

    def __init__(self, max_turns: int = 10, ttl_seconds: int = 1800):
        self.max_turns = max_turns
        self.ttl_seconds = ttl_seconds
        self._sessions: dict[str, deque[ConversationTurn]] = defaultdict(
            lambda: deque(maxlen=max_turns)
        )
        self._last_access: dict[str, float] = {}
        self._lock = threading.Lock()

    def add_turn(self, session_id: str, role: str, content: str) -> None:
        """Append a user or assistant turn to the session history."""
        with self._lock:
            self._sessions[session_id].append(
                ConversationTurn(role=role, content=content)
            )
            self._last_access[session_id] = time.time()

    def get_history(self, session_id: str) -> List[ConversationTurn]:
        """Return the conversation history for a session (oldest first)."""
        with self._lock:
            self._last_access[session_id] = time.time()
            return list(self._sessions[session_id])

    def get_history_as_text(self, session_id: str) -> str:
        """
        Format conversation history into a readable block
        that can be injected into the LLM prompt.
        """
        history = self.get_history(session_id)
        if not history:
            return ""
        lines = []
        for turn in history:
            prefix = "User" if turn.role == "user" else "Assistant"
            lines.append(f"{prefix}: {turn.content}")
        return "\n".join(lines)

    def clear_session(self, session_id: str) -> None:
        """Manually clear a session's history."""
        with self._lock:
            self._sessions.pop(session_id, None)
            self._last_access.pop(session_id, None)

    def cleanup_expired(self) -> int:
        """Remove sessions that haven't been accessed within ttl_seconds.
        Returns the number of sessions removed. Call periodically."""
        now = time.time()
        expired = []
        with self._lock:
            for sid, last in self._last_access.items():
                if now - last > self.ttl_seconds:
                    expired.append(sid)
            for sid in expired:
                self._sessions.pop(sid, None)
                self._last_access.pop(sid, None)
        return len(expired)


# Singleton — 10 turns per session, 30 min TTL
memory_service = MemoryService(max_turns=10, ttl_seconds=1800)