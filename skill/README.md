# Agent skill: `rasa-rag-helpdesk`

This folder turns TenantIQ into an **agent skill**. A skill is a `SKILL.md` with scripts and reference docs that AI coding agents (Claude Code, Codex, Cursor...) load to do a job. With it, a developer can tell their agent *"set up a Rasa + RAG helpdesk bot for my business"*, and the agent creates and customises this project for them.

```
skill/
├── package_skill.py            # builds dist/rasa-rag-helpdesk.zip for upload
└── rasa-rag-helpdesk/
    ├── SKILL.md                # instructions the agent follows
    ├── scripts/
    │   ├── check_env.py        # checks Python/Node/Ollama/Docker
    │   ├── scaffold.py         # copies the project, renames the bot, creates .env
    │   └── smoke_test.py       # verifies /health, Rasa route and LLM answer
    └── reference/
        ├── customizing.md      # intents, persona, model, knowledge base, branding
        └── troubleshooting.md
```

## Build the upload ZIP

```bash
python skill/package_skill.py
```

This writes `dist/rasa-rag-helpdesk.zip` (git-ignored). The ZIP bundles a clean copy of this repo under `templates/project/`, without `.env`, databases, models, `node_modules` or other local files. The script stops with an error if any of those would be included.

Rebuild the ZIP whenever the project code changes, and upload it again.

## Try it locally before publishing

```bash
python skill/rasa-rag-helpdesk/scripts/check_env.py
python skill/rasa-rag-helpdesk/scripts/scaffold.py --template . --target ../helpdesk-test --name "Demo Desk"
# run the generated project per its README, then:
python skill/rasa-rag-helpdesk/scripts/smoke_test.py
```

To test it as an agent would, unzip `dist/rasa-rag-helpdesk.zip` into `~/.claude/skills/` and ask Claude Code: *"Build me a helpdesk chatbot for a coaching institute using the rasa-rag-helpdesk skill."*
