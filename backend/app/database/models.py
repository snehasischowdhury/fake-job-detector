import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class JobAnalysisRecord(Base):
    __tablename__ = "job_analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    source_type: Mapped[str] = mapped_column(
        String(24), nullable=False, default="manual", index=True
    )
    original_filename: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    extraction_method: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    extracted_payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    job_title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    submitted_payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    heuristics_json: Mapped[str] = mapped_column(Text, nullable=False)
    predicted_class: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    prediction_label: Mapped[str] = mapped_column(String(40), nullable=False)
    model_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    risk_level: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    __table_args__ = (
        Index("ix_job_analyses_risk_created", "risk_level", "created_at"),
    )
