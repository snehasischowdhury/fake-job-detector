import json
from typing import Optional

from sqlalchemy.orm import Session

from app.config import Settings
from app.core.heuristics import evaluate_heuristics
from app.core.prediction_service import DISCLAIMER_TEXT, PredictionService
from app.core.preprocessing import extract_company_name
from app.database.models import JobAnalysisRecord
from app.database.repository import AnalysisRepository
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import (
    AnalysisRecordResponse,
    HeuristicIndicatorSchema,
    HistoryListResponse,
    ModelMetadata,
    PredictionPayload,
    PredictionResponse,
    StatisticsResponse,
)


class AnalysisService:
    """Coordinates ML inference, independent heuristics, and persistence."""

    def __init__(
        self,
        prediction_service: PredictionService,
        repository: AnalysisRepository,
        settings: Settings,
    ) -> None:
        self.prediction_service = prediction_service
        self.repository = repository
        self.settings = settings

    def analyze_and_store(
        self, db: Session, job: JobPostingRequest
    ) -> PredictionResponse:
        prediction_payload, _ = self.prediction_service.predict(job)
        heuristics = evaluate_heuristics(job)

        record = JobAnalysisRecord(
            job_title=job.title,
            company=extract_company_name(job.company_profile),
            submitted_payload_json=job.model_dump_json(),
            heuristics_json=json.dumps([h.model_dump() for h in heuristics]),
            predicted_class=prediction_payload.predicted_class,
            prediction_label=prediction_payload.label,
            model_score=prediction_payload.score,
            risk_level=prediction_payload.risk_level,
            model_version=self.settings.model_version,
        )
        saved = self.repository.create(db, record)

        return PredictionResponse(
            success=True,
            analysis_id=saved.id,
            created_at=saved.created_at,
            prediction=prediction_payload,
            model=ModelMetadata(
                name=self.settings.model_name,
                version=self.settings.model_version,
            ),
            heuristics=heuristics,
            disclaimer=DISCLAIMER_TEXT,
        )

    def _to_record_response(
        self, record: JobAnalysisRecord
    ) -> AnalysisRecordResponse:
        input_payload = JobPostingRequest.model_validate_json(
            record.submitted_payload_json
        )
        heuristics_raw = json.loads(record.heuristics_json)
        heuristics = [
            HeuristicIndicatorSchema.model_validate(item) for item in heuristics_raw
        ]
        return AnalysisRecordResponse(
            id=record.id,
            created_at=record.created_at,
            job_title=record.job_title,
            company=record.company,
            input=input_payload,
            prediction=PredictionPayload(
                label=(
                    "Potentially Fraudulent"
                    if record.predicted_class == 1
                    else "Legitimate"
                ),
                predicted_class=1 if record.predicted_class == 1 else 0,
                score=record.model_score,
                risk_level=record.risk_level,  # type: ignore[arg-type]
            ),
            model=ModelMetadata(
                name=self.settings.model_name,
                version=record.model_version,
            ),
            heuristics=heuristics,
            disclaimer=DISCLAIMER_TEXT,
        )

    def get_history(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        sort_by: str = "date-desc",
        page: int = 1,
        page_size: int = 20,
    ) -> HistoryListResponse:
        records, total = self.repository.list_records(
            db,
            search=search,
            risk_level=risk_level,
            sort_by=sort_by,
            page=page,
            page_size=page_size,
        )
        return HistoryListResponse(
            success=True,
            total=total,
            page=page,
            page_size=page_size,
            items=[self._to_record_response(r) for r in records],
        )

    def get_one(
        self, db: Session, analysis_id: str
    ) -> Optional[AnalysisRecordResponse]:
        record = self.repository.get_by_id(db, analysis_id)
        if record is None:
            return None
        return self._to_record_response(record)

    def delete_one(self, db: Session, analysis_id: str) -> bool:
        return self.repository.delete_by_id(db, analysis_id)

    def get_statistics(self, db: Session) -> StatisticsResponse:
        stats = self.repository.get_statistics(db)
        return StatisticsResponse(success=True, **stats)
