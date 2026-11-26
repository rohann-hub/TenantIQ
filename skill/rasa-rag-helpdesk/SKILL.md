---
name: rasa-rag-helpdesk
description: Build a self-hosted AI helpdesk chatbot (Rasa NLU intent routing + ChromaDB RAG + Ollama local LLM + FastAPI + React chat UI) customised to the user's business, documents and brand. Use when the user wants a private/local customer-support or FAQ bot, a Rasa + RAG hybrid, or a chatbot that answers from their own PDFs, docs or website without paid API keys.
---

# Rasa + RAG Helpdesk Builder

This skill sets up **TenantIQ**, a working helpdesk assistant, in the user's folder and adapts it to their business:

```
React chat UI  ->  FastAPI orchestrator  ->  Rasa NLU (intent + confidence)
                                         ->  ChromaDB RAG (their documents)
                                         ->  Ollama local LLM (answer)
                                         ->  SQLite (conversation logs)
```

High-confidence small talk (greet, thanks, bye...) is answered by Rasa instantly. Everything else goes through retrieval over the user's documents and is answered by a local LLM. No paid API keys are needed. The data stays on the user's machine.

## Before you start: ask the user

Ask these in one message, then proceed with sensible defaults for anything they skip:

1. **Bot name** (shown in the UI header, input box and tab title). Default: `TenantIQ`.
2. **What the business does** and the 3-8 most common customer questions (these become Rasa FAQ intents).
3. **Knowledge sources**: files (PDF, TXT, MD, CSV, JSON) and/or public web pages to ingest.
4. **How to run it**: local terminals (default) or Docker Compose.
5. **LLM model**: `llama3.2:1b` (default, fast, ~1.3 GB) or a stronger one such as `llama3.1:8b` / `qwen2.5:7b` if their machine has 16 GB+ RAM.

## Step 1: Check prerequisites

Run from this skill's folder:

```bash
python scripts/check_env.py
```

It reports Python 3.8-3.10 (needed by Rasa 3.6), Python 3.10+ for the backend, Node 18+, Ollama (installed, running, model pulled) and Docker. For anything missing, tell the user exactly what to install and link the official installer. **Do not install system software without the user's go-ahead.** With Docker only Docker + Ollama are required.

## Step 2: Create the project

```bash
python scripts/scaffold.py --target <project-folder> --name "<Bot Name>"
```

- Copies the bundled template (`templates/project/`) into the target. If the template is not present next to the skill, pass `--git https://github.com/rohann-hub/TenantIQ` to clone it instead.
- Renames the UI brand from `TenantIQ` to the chosen name.
- Creates `backend/.env` from `backend/.env.example` (never overwrites an existing `.env`).
- Refuses to write into a non-empty folder unless `--force` is given. Ask the user before using `--force`.

## Step 3: Adapt it to the business

Read `reference/customizing.md` and apply it. In short:

1. **Rasa training data**: in `data/nlu.yml`, replace the sample `faq/hours`, `faq/contact`, `faq/pricing` intents with the user's real questions (8-15 examples each, varied wording, include Hinglish/regional phrasing if their customers use it). Add a matching `utter_faq/<name>` response for each in `domain.yml`. Keep `greet`, `goodbye`, `thank_you`, etc.
2. **Static replies**: keep `RASA_STATIC_RESPONSES` in `backend/app/api/endpoints/chat.py` in sync with the `utter_*` texts in `domain.yml`. These are what users see for instant Rasa answers.
3. **Persona**: edit `SYSTEM_PROMPT` in `backend/app/services/llm_service.py` to name the bot and the business and to set the tone. Keep rule 1 (prefer knowledge-base context).
4. Validate: `rasa data validate`. Fix every error before training.

## Step 4: Install, train and run

Follow the project `README.md`. The essentials:

**Local (4 terminals):**
```bash
# 1  Rasa (Python 3.8-3.10 venv):   pip install -r requirements.txt
rasa train
rasa run --enable-api
# 2  Ollama
ollama pull <model>      # then make sure `ollama serve` / the Ollama app is running
# 3  Backend (separate venv OK):    pip install -r backend/requirements.txt
cd backend && uvicorn app.main:app --env-file .env --port 8000
# 4  Frontend
cd rasa-frontend && npm install && npm run dev      # http://localhost:5173
```

**Docker:** `ollama serve` on the host, then `docker compose up --build -d`. The Rasa container trains a model on first start (a few minutes). Follow with `docker compose logs -f rasa`. The UI is at http://localhost:3000.

Always run `rasa train` again after any change to `data/` or `domain.yml`.

## Step 5: Load the knowledge base

With the backend running, ingest the user's sources:

```bash
curl -F "file=@path/to/handbook.pdf" http://localhost:8000/api/v1/ingest/file
curl -X POST http://localhost:8000/api/v1/ingest/text -H "Content-Type: application/json" -d "{\"text\": \"...\", \"source\": \"policies\"}"
curl -X POST http://localhost:8000/api/v1/crawl -H "Content-Type: application/json" -d "{\"url\": \"https://example.com/faq\"}"
```

Supported files: `.pdf .txt .md .csv .json`. Only crawl URLs the user gave you. To re-crawl pages every 24h, add them to `TARGET_URLS` in `backend/app/core/scheduler.py`.

## Step 6: Verify

```bash
python scripts/smoke_test.py --url http://localhost:8000 --question "<one of the user's real questions>"
```

It checks `/health` (`"rasa": "ok"` means the model is loaded), sends a greeting (expects `route: rasa`) and a real question (expects `route: llm`, ideally `rag_relevant: true`). If anything fails, use `reference/troubleshooting.md`. Do not report success until the smoke test passes.

## Finish

Tell the user: the URL of the UI, how to add more documents (Step 5), how to retrain after editing intents, and the security notes below if they plan to put it on the internet.

## Security and network behaviour (disclose to the user)

- The skill's scripts use only the Python standard library. `check_env.py` and `smoke_test.py` talk only to `localhost` (Ollama, the backend). `scaffold.py` makes no network calls unless `--git` is passed (then it runs `git clone` on that URL).
- Installing and running the project downloads packages from PyPI/npm, Docker images (`rasa/rasa`, `rasa/rasa-sdk`, `python`, `node`, `nginx`), the Ollama model, and the `all-MiniLM-L6-v2` embedding model from Hugging Face on first run.
- At runtime, the backend calls Rasa and Ollama (local). It fetches web pages only through `/api/v1/crawl` or `TARGET_URLS`.
- The app is built for local/private use: `/api/v1/ingest/*` and `/api/v1/crawl` have **no authentication**, and CORS allows all origins. Before exposing it publicly, add an API key or login to those routes, restrict `allow_origins` in `backend/app/main.py`, and put it behind HTTPS.
- Never commit `backend/.env`.
