#!/usr/bin/env python3
"""
Create a new Rasa + RAG helpdesk project from the TenantIQ template.

Usage:
    python scaffold.py --target ./my-helpdesk --name "Acme Support"
    python scaffold.py --target ./my-helpdesk --git https://github.com/rohann-hub/TenantIQ

Standard library only. No network access unless --git is used (then `git clone`).
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = SKILL_DIR / "templates" / "project"
TEMPLATE_BRAND = "TenantIQ"

# Never copy build output, caches, secrets or local data into a new project.
EXCLUDE_NAMES = {
    ".git", "node_modules", ".venv", "venv", "__pycache__", ".rasa",
    "chroma_db", "dist", ".env", ".pytest_cache",
}
EXCLUDE_SUFFIXES = {".db", ".sqlite", ".sqlite3", ".pyc", ".tsbuildinfo", ".tar.gz"}
# Excluded only at these exact paths (relative to the project root).
# NOTE: "models" must stay root-only: backend/app/models/ holds the ORM code.
EXCLUDE_PATHS = {"models", "skill", "backend/data"}

# Files where the UI brand name appears.
BRAND_FILES = [
    "rasa-frontend/index.html",
    "rasa-frontend/src/components/Layout/Header.tsx",
    "rasa-frontend/src/components/Layout/Footer.tsx",
    "rasa-frontend/src/components/Chat/ChatInput.tsx",
]


def make_ignore(root: Path):
    root = root.resolve()

    def _ignore(directory, names):
        rel_dir = Path(directory).resolve().relative_to(root)
        skipped = []
        for name in names:
            rel = (rel_dir / name).as_posix()
            if (
                name in EXCLUDE_NAMES
                or rel in EXCLUDE_PATHS
                or any(name.endswith(s) for s in EXCLUDE_SUFFIXES)
            ):
                skipped.append(name)
        return skipped

    return _ignore


def _is_project(path: Path) -> bool:
    return (path / "backend" / "app" / "main.py").is_file() and (path / "domain.yml").is_file()


def _clone(url: str, dest: Path) -> Path:
    print(f"Cloning {url} ...")
    try:
        subprocess.run(["git", "clone", "--depth", "1", url, str(dest)], check=True)
    except FileNotFoundError:
        sys.exit("ERROR: git is not installed. Install git or use the bundled template.")
    except subprocess.CalledProcessError:
        sys.exit(f"ERROR: git clone failed for {url}")
    return dest


def _rebrand(target: Path, name: str) -> list:
    changed = []
    for rel in BRAND_FILES:
        f = target / rel
        if not f.is_file():
            continue
        text = f.read_text(encoding="utf-8")
        if TEMPLATE_BRAND in text:
            f.write_text(text.replace(TEMPLATE_BRAND, name), encoding="utf-8")
            changed.append(rel)
    return changed


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--target", required=True, help="Folder to create the project in")
    p.add_argument("--name", default=TEMPLATE_BRAND, help="Bot name shown in the UI (default: TenantIQ)")
    p.add_argument("--template", help="Path to a template project (default: the one bundled with this skill)")
    p.add_argument("--git", help="Clone the template from this git URL instead of using the bundled copy")
    p.add_argument("--force", action="store_true", help="Allow writing into a non-empty target folder")
    args = p.parse_args()

    name = args.name.strip()
    if not name or any(c in name for c in "<>{}`"):
        sys.exit("ERROR: --name must be plain text (no < > { } or backticks).")

    target = Path(args.target).expanduser().resolve()
    if target.exists() and any(target.iterdir()) and not args.force:
        sys.exit(f"ERROR: {target} is not empty. Choose another folder or pass --force.")

    tmp = None
    if args.git:
        tmp = tempfile.mkdtemp(prefix="helpdesk-template-")
        source = _clone(args.git, Path(tmp) / "src")
    else:
        source = Path(args.template).expanduser().resolve() if args.template else DEFAULT_TEMPLATE

    try:
        if not _is_project(source):
            sys.exit(
                f"ERROR: no project template found at {source}.\n"
                "Re-run with --git https://github.com/rohann-hub/TenantIQ"
            )

        shutil.copytree(source, target, ignore=make_ignore(source), dirs_exist_ok=True)
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)

    changed = _rebrand(target, name) if name != TEMPLATE_BRAND else []

    env_example = target / "backend" / ".env.example"
    env_file = target / "backend" / ".env"
    if env_example.is_file() and not env_file.exists():
        shutil.copyfile(env_example, env_file)
        env_note = "created backend/.env from .env.example"
    else:
        env_note = "kept existing backend/.env" if env_file.exists() else "no .env.example found"

    print(f"\nProject created at: {target}")
    print(f"  Bot name: {name}" + (f" (updated {len(changed)} UI files)" if changed else ""))
    print(f"  Config:   {env_note}")
    print("\nNext steps:")
    print("  1. Edit data/nlu.yml + domain.yml for the business, then: rasa data validate")
    print("  2. rasa train && rasa run --enable-api")
    print("  3. cd backend && uvicorn app.main:app --env-file .env --port 8000")
    print("  4. cd rasa-frontend && npm install && npm run dev")
    print("  (or: docker compose up --build -d)")


if __name__ == "__main__":
    main()
