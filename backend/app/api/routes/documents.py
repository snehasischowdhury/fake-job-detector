from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_analysis_service
from app.config import Settings, get_settings
from app.core.model_loader import ModelLoadError
from app.core.pdf_extractor import PdfProcessingError
from app.database.connection import get_db
from app.schemas.document_schema import (
    DocumentAnalyzeRequest,
    DocumentExtractionResponse,
    TextExtractRequest,
)
from app.schemas.prediction_schema import PredictionResponse
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/extract", response_model=DocumentExtractionResponse)
async def extract_pdf_document(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> DocumentExtractionResponse:
    service = DocumentService(settings=settings)
    try:
        return await service.process_pdf_upload(file)
    except PdfProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/extract-text", response_model=DocumentExtractionResponse)
def extract_pasted_text(
    payload: TextExtractRequest,
    settings: Settings = Depends(get_settings),
) -> DocumentExtractionResponse:
    service = DocumentService(settings=settings)
    return service.process_raw_text(payload.text)


@router.post("/analyze", response_model=PredictionResponse)
def analyze_reviewed_document(
    payload: DocumentAnalyzeRequest,
    db: Session = Depends(get_db),
    analysis_service: AnalysisService = Depends(get_analysis_service),
) -> PredictionResponse:
    try:
        return analysis_service.analyze_reviewed_document(db, payload)
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
