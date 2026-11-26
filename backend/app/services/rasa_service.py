import os
import httpx
from typing import Dict, Any

RASA_DOWN_HINT = (
    "Rasa NLU is unavailable, so every message is being routed to the LLM. "
    "Make sure `rasa train` has been run (a model .tar.gz exists in models/) "
    "and `rasa run --enable-api` is running at {url}."
)


class RasaService:
    def __init__(self, rasa_url: str = None):
        self.rasa_url = rasa_url or os.getenv("RASA_URL", "http://localhost:5005")
        self._warned = False  # print the "Rasa is down" hint only once

    def _warn_once(self, error: Exception) -> None:
        if not self._warned:
            print(f"[Rasa] WARNING: {RASA_DOWN_HINT.format(url=self.rasa_url)} ({error})")
            self._warned = True

    async def status(self) -> Dict[str, Any]:
        """
        Ask Rasa which model is loaded (GET /status).
        Returns {"ok": bool, "model": str | None, "error": str | None}.
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.rasa_url}/status", timeout=3.0)
                response.raise_for_status()
                model = response.json().get("model_file")
                if not model:
                    return {"ok": False, "model": None, "error": "no model loaded - run `rasa train`"}
                return {"ok": True, "model": model, "error": None}
        except Exception as e:
            return {"ok": False, "model": None, "error": str(e) or type(e).__name__}

    async def get_intent_and_entities(self, text: str) -> Dict[str, Any]:
        """
        Sends the text to Rasa's /model/parse endpoint to get the intent and entities.
        """
        url = f"{self.rasa_url}/model/parse"
        payload = {"text": text}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=5.0)
                response.raise_for_status()
                data = response.json()

                # Extract the relevant parts
                intent = data.get("intent", {})
                entities = data.get("entities", [])

                self._warned = False  # Rasa is back; warn again if it drops later
                return {
                    "intent": intent.get("name"),
                    "confidence": intent.get("confidence"),
                    "entities": entities
                }
            except Exception as e:
                self._warn_once(e)
                return {
                    "intent": None,
                    "confidence": 0.0,
                    "entities": [],
                    "error": str(e)
                }

rasa_service = RasaService()
