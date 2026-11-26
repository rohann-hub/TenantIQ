#!/usr/bin/env python3
"""
Check what the Rasa + RAG helpdesk needs on this machine.

Usage:
    python check_env.py [--ollama-url http://localhost:11434] [--model llama3.2:1b]

Standard library only. Network access: only the local Ollama URL.
Exit code 0 = ready for a local run, 1 = something required is missing.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

OK, MISS, WARN = "OK  ", "MISS", "WARN"


def run(cmd):
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        return (out.stdout + out.stderr).strip()
    except (OSError, subprocess.TimeoutExpired):
        return ""


def py_version(cmd):
    out = run(cmd + ["-c", "import sys;print('%d.%d' % sys.version_info[:2])"])
    m = re.match(r"^(\d+)\.(\d+)$", out.strip())
    return (int(m.group(1)), int(m.group(2))) if m else None


def find_rasa_python():
    """Rasa 3.6 needs Python 3.8-3.10."""
    candidates = []
    if os.name == "nt" and shutil.which("py"):
        candidates += [["py", "-3.10"], ["py", "-3.9"], ["py", "-3.8"]]
    candidates += [["python3.10"], ["python3.9"], ["python3.8"], ["python3"], ["python"]]
    for cmd in candidates:
        if cmd[0] != "py" and not shutil.which(cmd[0]):
            continue
        v = py_version(cmd)
        if v and (3, 8) <= v <= (3, 10):
            return " ".join(cmd), v
    return None, None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ollama-url", default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))
    p.add_argument("--model", default=os.getenv("OLLAMA_MODEL", "llama3.2:1b"))
    args = p.parse_args()

    rows, required_missing = [], False

    def add(status, item, detail, required=True):
        nonlocal required_missing
        rows.append((status, item, detail))
        if status == MISS and required:
            required_missing = True

    # Python for Rasa
    cmd, v = find_rasa_python()
    if cmd:
        add(OK, "Python 3.8-3.10 (Rasa)", f"{cmd} -> {v[0]}.{v[1]}")
    else:
        add(MISS, "Python 3.8-3.10 (Rasa)",
            "Rasa 3.6 will not install on 3.11+. Install Python 3.10 from python.org (or use Docker).")

    # Python for the backend (this interpreter)
    cur = sys.version_info[:2]
    if cur >= (3, 9):
        add(OK, "Python 3.9+ (backend)", f"{cur[0]}.{cur[1]}")
    else:
        add(WARN, "Python 3.9+ (backend)", f"running {cur[0]}.{cur[1]}; the backend needs 3.9+", required=False)

    # Node / npm
    node = run(["node", "--version"]) if shutil.which("node") else ""
    m = re.match(r"v(\d+)", node)
    if m and int(m.group(1)) >= 18:
        add(OK, "Node.js 18+", node)
    elif node:
        add(MISS, "Node.js 18+", f"found {node}; install Node 18 or newer from nodejs.org")
    else:
        add(MISS, "Node.js 18+", "not found; install from nodejs.org")
    add(OK if shutil.which("npm") else MISS, "npm", "found" if shutil.which("npm") else "comes with Node.js")

    # Ollama
    if shutil.which("ollama"):
        add(OK, "Ollama installed", run(["ollama", "--version"]).splitlines()[0] if run(["ollama", "--version"]) else "found")
    else:
        add(MISS, "Ollama installed", "install from https://ollama.com/download")
    try:
        with urllib.request.urlopen(f"{args.ollama_url.rstrip('/')}/api/tags", timeout=3) as r:
            models = [m.get("name", "") for m in json.load(r).get("models", [])]
        add(OK, "Ollama running", args.ollama_url)
        wanted = args.model if ":" in args.model else args.model + ":latest"
        if wanted in models:
            add(OK, f"Model {args.model}", "pulled")
        else:
            add(MISS, f"Model {args.model}", f"run: ollama pull {args.model}")
    except Exception:
        add(MISS, "Ollama running", f"nothing answering at {args.ollama_url}; start the Ollama app or `ollama serve`")

    # Docker (optional)
    if shutil.which("docker"):
        info = run(["docker", "info", "--format", "{{.ServerVersion}}"])
        if re.match(r"^\d+\.", info):
            add(OK, "Docker (optional)", f"engine {info}", required=False)
        else:
            add(WARN, "Docker (optional)", "installed but the engine is not running", required=False)
    else:
        add(WARN, "Docker (optional)", "not installed; only needed for `docker compose up`", required=False)

    width = max(len(r[1]) for r in rows)
    for status, item, detail in rows:
        print(f"[{status}] {item.ljust(width)}  {detail}")

    print()
    if required_missing:
        print("Not ready for a local run yet. With Docker you only need Docker + Ollama (+ the model).")
        sys.exit(1)
    print("Ready.")


if __name__ == "__main__":
    main()
