from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Fake Job Detector API"
    app_version: str = "1.0.0"
    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "sqlite:///./fake_job_detector.db"

    model_path: str = "models/job_detector.pkl"
    model_name: str = "TF-IDF + Logistic Regression"
    model_version: str = "1.0"

    risk_medium_min: float = 0.35
    risk_high_min: float = 0.70

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_request_bytes: int = 65536
    max_upload_bytes: int = 10485760
    max_pdf_pages: int = 25
    ocr_min_chars_per_page: int = 60
    ocr_dpi: int = 200
    ocr_timeout_seconds: int = 20

    rate_limit_requests: int = 30
    rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
