# Customizing the helpdesk for a business

All paths are relative to the generated project root.

## How a message is routed

`backend/app/api/endpoints/chat.py`:

1. Rasa `/model/parse` returns an intent and a confidence.
2. If confidence >= `RASA_HIGH_CONFIDENCE` (0.80) **and** the intent is in `RASA_DIRECT_INTENTS`, the reply is the matching text in `RASA_STATIC_RESPONSES`. Route is `rasa`, and it's instant.
3. Otherwise the query goes to ChromaDB retrieval and the LLM answers. Route is `llm`. If the best chunk scores below `RAGService.RELEVANCE_THRESHOLD` (0.35), the LLM answers from its own knowledge.

So **facts the bot must get right belong in the knowledge base** (ingested documents). Rasa handles small talk and routing.

## 1. Intents and FAQs (Rasa)

`data/nlu.yml`: give each intent 8-15 varied examples. Use the words real customers type, including short forms and Hinglish if relevant:

```yaml
- intent: faq/refund_policy
  examples: |
    - how do I get a refund
    - refund kaise milega
    - can I return my order
    - money back policy?
```

`domain.yml`: add the answer for every `faq/<name>` intent:

```yaml
responses:
  utter_faq/refund_policy:
    - text: "Refunds are processed within 5-7 working days after we receive the item."
```

The backend sends `faq` questions through RAG + LLM, not the `utter_faq/*` texts. Those texts are only used by Rasa's own dialogue (`rasa shell`). So **also ingest the same FAQ answers** as text (see section 4), so the LLM has them.

To make a new intent answer instantly without the LLM:
1. add it to `nlu.yml` and give it an `utter_<intent>` response in `domain.yml`,
2. add the intent name to `RASA_DIRECT_INTENTS` and its reply to `RASA_STATIC_RESPONSES` in `chat.py`.

Remove sample intents the business doesn't need from `nlu.yml`, `domain.yml`, `rules.yml`, `stories.yml` **and** `tests/test_stories.yml` together, or `rasa train` / `rasa test` will fail.

Then:
```bash
rasa data validate      # must show no errors (warnings about unused intents are fine)
rasa train
```

## 2. Bot persona

`backend/app/services/llm_service.py` -> `SYSTEM_PROMPT`. Example:

```python
SYSTEM_PROMPT = (
    "You are Acme Support, the helpdesk assistant for Acme Broadband (Kolkata). "
    "Answer questions about plans, billing, outages and installation.\n\n"
    "Rules you MUST follow:\n"
    "1. If relevant context from a knowledge base is provided below, use it ... "
    ...
)
```

Keep the context-first rule. For a strict bot that must not answer off-topic questions, change rule 2 to: *"If no relevant context is provided, say you can only help with Acme topics and suggest contacting support."*

## 3. Model choice

Set in `backend/.env` (or the shell / docker compose environment):

| Machine | `OLLAMA_MODEL` |
|---|---|
| 8 GB RAM, no GPU | `llama3.2:1b` (default) or `llama3.2:3b` |
| 16 GB RAM | `llama3.1:8b`, `qwen2.5:7b` |
| GPU 12 GB+ | `qwen2.5:14b` |

Run `ollama pull <model>` first. Restart the backend after changing it.

## 4. Knowledge base

Backend must be running. Ingested chunks persist in `backend/chroma_db/`.

| Source | Endpoint |
|---|---|
| File (.pdf .txt .md .csv .json) | `POST /api/v1/ingest/file` (multipart `file`) |
| Raw text | `POST /api/v1/ingest/text` `{"text": "...", "source": "faq"}` |
| Many texts | `POST /api/v1/ingest/bulk` `{"documents": ["...", "..."], "source": "kb"}` |
| Web page | `POST /api/v1/crawl` `{"url": "https://..."}` (runs in background) |

Scheduled re-crawl: add URLs to `TARGET_URLS` in `backend/app/core/scheduler.py` (crawled at startup and every 24h).

Re-ingesting the same file adds duplicate chunks. To start the knowledge base fresh, stop the backend and delete `backend/chroma_db/`.

Scanned PDFs (images) have no text layer, so ingest returns `chunks_added: 0`. OCR them first.

## 5. Branding (frontend)

`scaffold.py --name` already replaced the name in `index.html`, `Header.tsx`, `Footer.tsx` and `ChatInput.tsx`. Suggested starter questions and the offline message are in `rasa-frontend/src/data/answers.ts`. Colours and fonts are in `rasa-frontend/src/styles/index.css` and `tailwind.config.js`.

## 6. Conversation logs

Every message is stored in the `chat_logs` table (SQLite `backend/chatbot.db`, or `backend/data/chatbot.db` under Docker): query, intent, confidence, route and answer. Low-confidence or `nlu_fallback` rows show which questions need new intents or documents.
