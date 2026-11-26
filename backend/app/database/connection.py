import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Default: ./chatbot.db next to where uvicorn runs (backend/).
# Docker sets DATABASE_URL=sqlite:////app/data/chatbot.db so the DB lives in a
# mounted *folder* (mounting a missing single file makes Docker create a directory).
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chatbot.db")

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    db_file = SQLALCHEMY_DATABASE_URL.split("sqlite:///", 1)[-1]
    if db_file and db_file != ":memory:":
        Path(db_file).parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
