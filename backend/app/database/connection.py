from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _build_engine(database_url: str):
    normalized_url = _normalize_database_url(database_url)
    connect_args = {}
    if normalized_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(
        normalized_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )


settings = get_settings()
engine = _build_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    from app.database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Idempotent column upgrade for existing SQLite/PostgreSQL databases
    inspector = inspect(engine)
    if "job_analyses" in inspector.get_table_names():
        existing_cols = {c["name"] for c in inspector.get_columns("job_analyses")}
        alter_statements = {
            "source_type": "ALTER TABLE job_analyses ADD COLUMN source_type VARCHAR(24) NOT NULL DEFAULT 'manual'",
            "original_filename": "ALTER TABLE job_analyses ADD COLUMN original_filename VARCHAR(150)",
            "extraction_method": "ALTER TABLE job_analyses ADD COLUMN extraction_method VARCHAR(24)",
            "extracted_payload_json": "ALTER TABLE job_analyses ADD COLUMN extracted_payload_json TEXT",
            "extraction_metadata_json": "ALTER TABLE job_analyses ADD COLUMN extraction_metadata_json TEXT",
        }
        with engine.begin() as conn:
            for col_name, sql in alter_statements.items():
                if col_name not in existing_cols:
                    conn.execute(text(sql))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection(db: Session) -> bool:
    try:
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
