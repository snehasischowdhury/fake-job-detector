from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_analysis_service
from app.database.connection import get_db
from app.schemas.prediction_schema import (
    AnalysisRecordResponse,
    HistoryListResponse,
    StatisticsResponse,
)
from app.services.analysis_service import AnalysisService

router = APIRouter(tags=["History & Statistics"])


@router.get("/history", response_model=HistoryListResponse)
def list_history(
    search: Optional[str] = Query(default=None, max_length=120),
    risk_level: Optional[Literal["ALL", "LOW", "MEDIUM", "HIGH"]] = Query(default="ALL"),
    sort_by: Literal["date-desc", "date-asc", "score-desc", "score-asc"] = Query(
        default="date-desc"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
) -> HistoryListResponse:
    return service.get_history(
        db,
        search=search,
        risk_level=risk_level,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )


@router.get("/history/{analysis_id}", response_model=AnalysisRecordResponse)
def get_history_item(
    analysis_id: str,
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
) -> AnalysisRecordResponse:
    record = service.get_one(db, analysis_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )
    return record


@router.delete("/history/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_history_item(
    analysis_id: str,
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
) -> dict:
    deleted = service.delete_one(db, analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )
    return {"success": True, "deleted_id": analysis_id}


@router.get("/statistics", response_model=StatisticsResponse)
def get_statistics(
    db: Session = Depends(get_db),
    service: AnalysisService = Depends(get_analysis_service),
) -> StatisticsResponse:
    return service.get_statistics(db)
