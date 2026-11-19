from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import documents, health, history, prediction
from app.config import get_settings
from app.core.model_loader import ModelLoadError, ModelLoader
from app.core.prediction_service import PredictionService
from app.database.connection import init_db
from app.database.repository import AnalysisRepository
from app.services.analysis_service import AnalysisService
from app.utils.logging import setup_logging
from app.utils.rate_limit import SlidingWindowRateLimiter


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
    rate_limiter = SlidingWindowRateLimiter(
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )
    app.state.rate_limiter = rate_limiter

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def security_and_limits_middleware(request: Request, call_next):
        content_length = request.headers.get("content-length")
        is_upload_route = request.url.path == "/api/v1/documents/extract"
        max_bytes = (
            settings.max_upload_bytes + 65536
            if is_upload_route
            else settings.max_request_bytes
        )
        if content_length and int(content_length) > max_bytes:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={
                    "success": False,
                    "error": "Request payload exceeds maximum allowed size.",
                },
            )

        rate_limited_paths = {
            "/api/v1/predict",
            "/api/v1/analyze-text",
            "/api/v1/documents/extract",
            "/api/v1/documents/extract-text",
            "/api/v1/documents/analyze",
        }
        if request.url.path in rate_limited_paths and request.method == "POST":
            client_ip = request.client.host if request.client else "unknown"
            allowed, retry_after = rate_limiter.check(client_ip)
            if not allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={"Retry-After": str(retry_after)},
                    content={
                        "success": False,
                        "error": "Rate limit exceeded. Please wait before submitting again.",
                    },
                )

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        return response

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
    app.include_router(documents.router, prefix="/api/v1")

    return app


app = create_app()
