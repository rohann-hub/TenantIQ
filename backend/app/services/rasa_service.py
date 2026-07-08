import httpx
from typing import Dict, Any

class RasaService:
    def __init__(self, rasa_url: str = "http://localhost:5005"):
        self.rasa_url = rasa_url

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
                
                return {
                    "intent": intent.get("name"),
                    "confidence": intent.get("confidence"),
                    "entities": entities
                }
            except Exception as e:
                print(f"Error connecting to Rasa: {e}")
                return {
                    "intent": None,
                    "confidence": 0.0,
                    "entities": [],
                    "error": str(e)
                }

rasa_service = RasaService()
