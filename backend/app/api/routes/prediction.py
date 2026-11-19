from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_analysis_service
from app.config import Settings, get_settings
from app.core.model_loader import ModelLoadError
from app.database.connection import get_db
from app.schemas.document_schema import DocumentAnalyzeRequest, TextExtractRequest
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import PredictionResponse
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService

router = APIRouter(tags=["Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
)
def predict_job_posting(
    payload: JobPostingRequest,
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
) -> PredictionResponse:
    try:
        return service.analyze_and_store(db, payload, source_type="manual")
    except ModelLoadError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is currently unavailable.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post(
    "/analyze-text",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
)
def analyze_raw_text(
    payload: TextExtractRequest,
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
    settings: Settings = Depends(get_settings),
) -> PredictionResponse:
    doc_service = DocumentService(settings=settings)
    extracted = doc_service.process_raw_text(payload.text)
    analyze_req = DocumentAnalyzeRequest(
        filename=extracted.filename,
        extraction_method="text_paste",
        source_type="text_paste",
        missing_fields=extracted.missing_fields,
        raw_extracted=extracted.job_information,
        reviewed=extracted.job_information,
    )
    try:
        return service.analyze_reviewed_document(db, analyze_req)
    except ModelLoadError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is currently unavailable.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
