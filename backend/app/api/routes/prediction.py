from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_analysis_service
from app.core.model_loader import ModelLoadError
from app.database.connection import get_db
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import PredictionResponse
from app.services.analysis_service import AnalysisService

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
        return service.analyze_and_store(db, payload)
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
