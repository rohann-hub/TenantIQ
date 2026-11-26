#!/usr/bin/env python3
"""
End-to-end check of a running helpdesk backend.

Usage:
    python smoke_test.py [--url http://localhost:8000] [--question "What are your opening hours?"]

Checks:
  1. GET  /health          -> backend up, and whether Rasa has a model loaded
  2. POST /api/v1/chat "hello"     -> expects route "rasa" (instant answer)
  3. POST /api/v1/chat <question>  -> expects route "llm" with a non-empty answer

Standard library only. Network access: only the backend URL you pass (default localhost).
Exit code 0 = all checks passed.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request


def call(method, url, body=None, timeout=180):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:8000")
    p.add_argument("--question", default="What are your support hours?")
    args = p.parse_args()
    base = args.url.rstrip("/")
    failures = []

    # 1. health
    try:
        h = call("GET", f"{base}/health", timeout=10)
    except (urllib.error.URLError, OSError) as e:
        sys.exit(f"[FAIL] Backend not reachable at {base} ({e}). Start it: cd backend && uvicorn app.main:app --port 8000")
    print(f"[OK]   Backend up: {h.get('service', h)}")
    if "rasa" not in h:
        print("[WARN] /health has no Rasa status (older backend version); skipping that check")
    elif h["rasa"] == "ok":
        print(f"[OK]   Rasa model loaded: {h.get('rasa_model')}")
    else:
        failures.append("rasa")
        print(f"[FAIL] Rasa unavailable: {h.get('rasa_error')}. Run `rasa train` then `rasa run --enable-api`.")

    # 2. greeting -> Rasa route
    try:
        r = call("POST", f"{base}/api/v1/chat", {"query": "hello", "session_id": "smoke-test"})
        if r.get("route") == "rasa":
            print(f"[OK]   'hello' answered by Rasa (intent={r.get('intent')}, conf={r.get('confidence', 0):.2f})")
        else:
            failures.append("greet-route")
            print(f"[FAIL] 'hello' went to route={r.get('route')} (intent={r.get('intent')}, "
                  f"conf={r.get('confidence')}). Rasa is down or the greet intent needs more examples.")
    except Exception as e:
        failures.append("greet-call")
        print(f"[FAIL] /api/v1/chat error: {e}")

    # 3. real question -> LLM (+RAG)
    try:
        r = call("POST", f"{base}/api/v1/chat", {"query": args.question, "session_id": "smoke-test"})
        answer = (r.get("final_answer") or "").strip()
        bad = (not answer) or "trouble generating a response" in answer
        if r.get("route") == "llm" and not bad:
            rag = "used knowledge base" if r.get("rag_relevant") else "no relevant documents found (ingest some?)"
            print(f"[OK]   Question answered by LLM, {rag}")
            print(f"       Q: {args.question}\n       A: {answer[:300]}")
        elif bad:
            failures.append("llm")
            print("[FAIL] LLM did not answer. Is Ollama running and is OLLAMA_MODEL pulled? (ollama list)")
        else:
            print(f"[OK]   Question answered via route={r.get('route')}: {answer[:200]}")
    except Exception as e:
        failures.append("question-call")
        print(f"[FAIL] /api/v1/chat error: {e}")

    print()
    if failures:
        print(f"{len(failures)} check(s) failed: {', '.join(failures)}. See reference/troubleshooting.md")
        sys.exit(1)
    print("All checks passed.")


if __name__ == "__main__":
    main()
