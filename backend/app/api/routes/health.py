from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database.connection import check_db_connection, get_db
from app.schemas.prediction_schema import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    model_loader = getattr(request.app.state, "model_loader", None)
    model_loaded = bool(model_loader and model_loader.is_loaded)
    db_ok = check_db_connection(db)

    status = "healthy" if (model_loaded and db_ok) else "degraded"
    detail = None
    if not model_loaded and model_loader is not None:
        detail = model_loader.load_error or "ML model is not loaded."
    elif not db_ok:
        detail = "Database connection check failed."

    return HealthResponse(
        status=status,
        model_loaded=model_loaded,
        database_connected=db_ok,
        model_name=settings.model_name,
        model_version=settings.model_version,
        detail=detail,
    )
