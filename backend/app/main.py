from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, history, prediction
from app.config import get_settings
from app.core.model_loader import ModelLoadError, ModelLoader
from app.core.prediction_service import PredictionService
from app.database.connection import init_db
from app.database.repository import AnalysisRepository
from app.services.analysis_service import AnalysisService
from app.utils.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger = setup_logging(settings.log_level)

    init_db()
    logger.info("Database tables initialized.")

    model_loader = ModelLoader(settings.model_path)
    try:
        model_loader.load()
    except ModelLoadError as exc:
        # Keep app running so /api/v1/health reports degraded state cleanly
        logger.error("Startup model load degraded: %s", exc)

    prediction_service = PredictionService(model_loader=model_loader, settings=settings)
    repository = AnalysisRepository()
    analysis_service = AnalysisService(
        prediction_service=prediction_service,
        repository=repository,
        settings=settings,
    )

    app.state.model_loader = model_loader
    app.state.analysis_service = analysis_service
    yield
    logger.info("Shutting down Fake Job Detector API.")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def limit_request_size(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_request_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "success": False,
                    "error": "Request payload exceeds maximum allowed size.",
                },
            )
        return await call_next(request)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Invalid request payload.",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, _exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "An unexpected internal error occurred.",
            },
        )

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(prediction.router, prefix="/api/v1")
    app.include_router(history.router, prefix="/api/v1")

    return app


app = create_app()
