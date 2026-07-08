# Rasa NLU Chatbot

A helpdesk-style assistant built on Rasa 3.6 with a DIET-based NLU pipeline, a ResponseSelector for FAQs, and a custom action layer that can plug into an external RAG micro-service (with a local keyword KB as fallback).

## Project structure

```
rasa-chatbot/
├── config.yml            # NLU pipeline (DIET) + dialogue policies (TED, Rule, Memoization)
├── domain.yml            # Intents, entities, slots, responses, actions
├── data/
│   ├── nlu.yml           # Training examples (incl. faq/* retrieval intents)
│   ├── rules.yml         # Deterministic paths + fallback routing
│   └── stories.yml       # ML training stories
├── actions/
│   └── actions.py        # action_query_knowledge_base (RAG hook + local KB)
├── tests/test_stories.yml
├── endpoints.yml
├── credentials.yml
└── requirements.txt
```

## Setup

Rasa 3.6 requires **Python 3.8–3.10** (3.10 recommended; it will NOT install on 3.11+).

```bash
# create env (conda example)
conda create -n rasa-bot python=3.10 -y
conda activate rasa-bot

pip install -r requirements.txt
```

## Train

```bash
rasa train
```

## Run

Terminal 1 — action server (required for knowledge-base queries):

```bash
rasa run actions
```

Terminal 2 — talk to the bot:

```bash
rasa shell
```

Or expose the REST API:

```bash
rasa run --enable-api --cors "*"
# POST http://localhost:5005/webhooks/rest/webhook
# body: {"sender": "user1", "message": "hello"}
```

## RAG integration (optional)

`action_query_knowledge_base` will call an external retrieval service if configured:

```bash
export RAG_ENDPOINT="http://localhost:8000/query"
export RAG_TIMEOUT_SECONDS=8
rasa run actions
```

Contract: `POST {"query": "<user text>"}` → `{"answer": "<text>"}`. This matches a typical FastAPI + Qdrant hybrid-retrieval service; if the endpoint is unset or unreachable, the action falls back to the built-in keyword KB in `actions.py`.

## Test & inspect

```bash
rasa test                 # runs tests/test_stories.yml + NLU cross-validation
rasa data validate        # checks domain/data consistency
rasa interactive          # generate new training data interactively
```

## Extending

1. Add intents/examples in `data/nlu.yml` (aim for 10+ varied examples each).
2. Register the intent and any responses in `domain.yml`.
3. Wire behavior in `rules.yml` (deterministic) or `stories.yml` (contextual).
4. Retrain with `rasa train`.
