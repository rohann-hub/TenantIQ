# Troubleshooting

Start with `python scripts/smoke_test.py` and `GET http://localhost:8000/health`.

## Rasa

| Symptom | Cause | Fix |
|---|---|---|
| `/health` shows `"rasa": "unavailable"`, every reply has `route: llm` | Rasa not running, or no trained model | `rasa train` then `rasa run --enable-api`. Under Docker: `docker compose logs -f rasa` (first start trains for a few minutes). |
| `pip install rasa==3.6.20` fails / "no matching distribution" | Python 3.11+ | Use Python 3.10 for the Rasa venv (`py -3.10 -m venv .venv` on Windows). The backend can use a separate, newer venv. |
| `ModuleNotFoundError: No module named 'pkg_resources'` | setuptools 81+ removed it | `pip install "setuptools<81"` (already pinned in `requirements.txt`). |
| `rasa train` errors about an intent/utterance | data, domain and rules out of sync | `rasa data validate` and fix every error. When you delete an intent, remove it from `nlu.yml`, `domain.yml`, `rules.yml`, `stories.yml` and `tests/`. |
| Docker on Linux: permission denied writing `models/` | Rasa image runs as uid 1001 | `mkdir -p models .rasa && sudo chown -R 1001 models .rasa` |
| Greetings not routed to Rasa | confidence below 0.80 | Add more varied examples to `greet` in `nlu.yml` and retrain. |

## LLM (Ollama)

| Symptom | Fix |
|---|---|
| Reply: "I'm having trouble generating a response right now" | Ollama is not running or the model is missing. Check with `ollama list`, `ollama pull <OLLAMA_MODEL>`, and confirm `curl http://localhost:11434/api/tags` answers. |
| Docker backend cannot reach Ollama | Ollama must run on the **host**. The compose file uses `host.docker.internal`. On Linux, start Ollama with `OLLAMA_HOST=0.0.0.0 ollama serve`. |
| Very slow answers | Use a smaller model (`llama3.2:1b`), or a machine with a GPU. The first request after start also loads the model into memory. |
| Weak or wrong answers | Use a bigger model (`OLLAMA_MODEL=llama3.1:8b`), ingest better source documents, and tighten `SYSTEM_PROMPT`. |

## Knowledge base (RAG)

| Symptom | Fix |
|---|---|
| `rag_relevant: false` for questions the documents cover | Ingest more focused text (FAQ-style paragraphs work best), or lower `RELEVANCE_THRESHOLD` in `backend/app/services/rag_service.py` slightly (e.g. 0.30). |
| First backend start hangs or fails downloading `all-MiniLM-L6-v2` | It downloads once from Hugging Face. It needs internet the first time, and later starts use the cache. Behind a proxy, set `HF_ENDPOINT` or pre-download the model. |
| PDF ingested with `chunks_added: 0` | Scanned PDF with no text layer. OCR it first. |
| Duplicate / stale answers | Delete `backend/chroma_db/` (backend stopped) and re-ingest. |

## Backend / database

| Symptom | Fix |
|---|---|
| `sqlite3.OperationalError: unable to open database file` under Docker | An old compose file mounted `chatbot.db` as a file and Docker created a folder instead. Use the current compose file (mounts `backend/data/`) and delete the stray `backend/chatbot.db` **folder**. |
| `ModuleNotFoundError: app.models` | `backend/app/models/` is missing. A `.gitignore` line `models/` hides it, so change it to `/models/`. |
| Frontend shows the offline message | Backend not on port 8000. In dev, Vite proxies `/api` to `127.0.0.1:8000` (`rasa-frontend/vite.config.ts`). |
