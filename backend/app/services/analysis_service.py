import json
from typing import Optional

from sqlalchemy.orm import Session

from app.config import Settings
from app.core.heuristics import evaluate_heuristics
from app.core.prediction_service import DISCLAIMER_TEXT, PredictionService
from app.core.preprocessing import extract_company_name
from app.database.models import JobAnalysisRecord
from app.database.repository import AnalysisRepository
from app.schemas.document_schema import (
    DocumentAnalyzeRequest,
    JobInformationExtracted,
)
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import (
    AnalysisRecordResponse,
    DocumentMetadataSummary,
    HeuristicIndicatorSchema,
    HistoryListResponse,
    ModelMetadata,
    PredictionPayload,
    PredictionResponse,
    SourceType,
    StatisticsResponse,
)


def map_extracted_to_job_request(info: JobInformationExtracted) -> JobPostingRequest:
    """
    Map user-reviewed extracted PDF fields into the exact JobPostingRequest schema
    expected by the existing TF-IDF + Logistic Regression pipeline.
    Never invents missing fields.
    """
    title = (info.job_title.value or "").strip() or "Untitled Job Posting"
    company_parts = [
        info.company_name.value,
        info.company_website.value,
        info.company_address.value,
    ]
    company_profile = " — ".join(p.strip() for p in company_parts if p and p.strip())

    desc_parts = [
        info.job_description.value,
        info.responsibilities.value,
        info.application_instructions.value,
    ]
    description = "\n\n".join(p.strip() for p in desc_parts if p and p.strip())
    if len(description) < 30:
        # Preserve actual extracted text if structured sections were sparse
        fallback_bits = [
            info.job_title.value,
            info.company_name.value,
            info.location.value,
            info.salary_range.value,
            info.skills.value,
            info.qualifications.value,
            info.contact_information.value,
        ]
        description = " ".join(b.strip() for b in fallback_bits if b and b.strip())
    if len(description) < 30:
        raise ValueError(
            "Insufficient job description text after extraction/review (minimum 30 characters required)."
        )

    req_parts = [
        info.qualifications.value,
        info.skills.value,
        info.required_experience.value,
        info.required_education.value,
    ]
    requirements = "\n".join(p.strip() for p in req_parts if p and p.strip())

    ben_parts = [
        info.benefits.value,
        info.incentives.value,
    ]
    benefits = "\n".join(p.strip() for p in ben_parts if p and p.strip())

    return JobPostingRequest(
        title=title[:150],
        company_profile=company_profile[:3000],
        location=(info.location.value or "")[:120],
        department=(info.department.value or "")[:120],
        salary_range=(info.salary_range.value or "")[:100],
        description=description[:8000],
        requirements=requirements[:4000],
        benefits=benefits[:2500],
        employment_type=(info.employment_type.value or "")[:80],
        required_experience=(info.required_experience.value or "")[:80],
        required_education=(info.required_education.value or "")[:80],
        industry=(info.industry.value or "")[:120],
        function_area="",
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
        self,
        db: Session,
        job: JobPostingRequest,
        *,
        source_type: SourceType = "manual",
        extracted_doc: Optional[JobInformationExtracted] = None,
        raw_extracted_doc: Optional[JobInformationExtracted] = None,
        original_filename: Optional[str] = None,
        extraction_method: Optional[str] = None,
        missing_fields: Optional[list[str]] = None,
    ) -> PredictionResponse:
        prediction_payload, _ = self.prediction_service.predict(job)
        heuristics = evaluate_heuristics(job, extracted_doc=extracted_doc)

        doc_meta_summary: Optional[DocumentMetadataSummary] = None
        doc_meta_json: Optional[str] = None
        if source_type != "manual" and extracted_doc is not None:
            doc_meta_summary = DocumentMetadataSummary(
                filename=original_filename,
                extraction_method=extraction_method,
                missing_fields=missing_fields or [],
                company_website=extracted_doc.company_website.value,
                company_email=extracted_doc.company_email.value,
                recruitment_email=extracted_doc.recruitment_email.value,
            )
            doc_meta_json = doc_meta_summary.model_dump_json()

        record = JobAnalysisRecord(
            source_type=source_type,
            original_filename=original_filename,
            extraction_method=extraction_method,
            extracted_payload_json=(
                raw_extracted_doc.model_dump_json() if raw_extracted_doc else None
            ),
            extraction_metadata_json=doc_meta_json,
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
            source_type=source_type,
            document_meta=doc_meta_summary,
            prediction=prediction_payload,
            model=ModelMetadata(
                name=self.settings.model_name,
                version=self.settings.model_version,
            ),
            heuristics=heuristics,
            disclaimer=DISCLAIMER_TEXT,
        )

    def analyze_reviewed_document(
        self, db: Session, req: DocumentAnalyzeRequest
    ) -> PredictionResponse:
        job_req = map_extracted_to_job_request(req.reviewed)
        return self.analyze_and_store(
            db,
            job_req,
            source_type=req.source_type,
            extracted_doc=req.reviewed,
            raw_extracted_doc=req.raw_extracted,
            original_filename=req.filename,
            extraction_method=req.extraction_method,
            missing_fields=req.missing_fields,
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
        doc_meta = (
            DocumentMetadataSummary.model_validate_json(record.extraction_metadata_json)
            if record.extraction_metadata_json
            else None
        )
        source_type: SourceType = (
            record.source_type
            if record.source_type in ("manual", "pdf_upload", "text_paste")
            else "manual"
        )  # type: ignore[assignment]

        return AnalysisRecordResponse(
            id=record.id,
            created_at=record.created_at,
            source_type=source_type,
            document_meta=doc_meta,
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
