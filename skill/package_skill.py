#!/usr/bin/env python3
"""
Build the marketplace upload: dist/rasa-rag-helpdesk.zip

The ZIP contains the skill folder (SKILL.md, scripts/, reference/) plus a clean copy
of this repository under templates/project/, so the skill works without network access.

Usage (from the repo root or anywhere):
    python skill/package_skill.py
"""

import importlib.util
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent          # <repo>/skill
REPO = HERE.parent
SKILL_NAME = "rasa-rag-helpdesk"
SKILL_SRC = HERE / SKILL_NAME
OUT = REPO / "dist" / f"{SKILL_NAME}.zip"

# Reuse the exact exclusion rules the scaffold script applies to new projects.
spec = importlib.util.spec_from_file_location("scaffold", SKILL_SRC / "scripts" / "scaffold.py")
scaffold = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scaffold)

# Extra things that are useful in the repo but not in a buyer's project.
REPO_ONLY = {"assets", ".github"}


def main() -> None:
    if not (SKILL_SRC / "SKILL.md").is_file():
        sys.exit(f"ERROR: {SKILL_SRC / 'SKILL.md'} not found")

    with tempfile.TemporaryDirectory() as tmp:
        stage = Path(tmp) / SKILL_NAME
        shutil.copytree(SKILL_SRC, stage, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "templates"))

        project = stage / "templates" / "project"
        base_ignore = scaffold.make_ignore(REPO)

        def ignore(directory, names):
            skipped = set(base_ignore(directory, names))
            if Path(directory).resolve() == REPO:
                skipped |= {n for n in names if n in REPO_ONLY}
            return list(skipped)

        shutil.copytree(REPO, project, ignore=ignore)

        # Sanity checks: the things that broke fresh clones before.
        must_exist = [
            "backend/app/models/log.py",
            "backend/app/main.py",
            "backend/.env.example",
            "domain.yml",
            "data/nlu.yml",
            "rasa-frontend/package.json",
            "docker-compose.yml",
        ]
        missing = [p for p in must_exist if not (project / p).exists()]
        if missing:
            sys.exit(f"ERROR: template is missing {missing}")
        leaked = [str(p.relative_to(project)) for p in project.rglob("*")
                  if p.name == ".env" or p.suffix in {".db", ".tsbuildinfo"} or p.name.endswith(".tar.gz")]
        if leaked:
            sys.exit(f"ERROR: refusing to package local/secret files: {leaked}")

        OUT.parent.mkdir(parents=True, exist_ok=True)
        if OUT.exists():
            OUT.unlink()
        files = sorted(p for p in stage.rglob("*") if p.is_file())
        with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
            for f in files:
                z.write(f, Path(SKILL_NAME) / f.relative_to(stage))

    size_kb = OUT.stat().st_size / 1024
    print(f"Built {OUT}  ({len(files)} files, {size_kb:.0f} KB)")
    print("Upload this ZIP on the marketplace's sell page.")


if __name__ == "__main__":
    main()
