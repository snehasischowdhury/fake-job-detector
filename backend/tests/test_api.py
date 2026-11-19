import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.core.model_loader import ModelLoadError, ModelLoader
from app.core.prediction_service import PredictionService
from app.database.connection import init_db
from app.database.repository import AnalysisRepository
from app.main import create_app
from app.services.analysis_service import AnalysisService


class DummyModel:
    """Deterministic stub implementing predict() and predict_proba() for unit tests."""

    def predict(self, texts):
        return np.array([1 if "registration fee" in t.lower() else 0 for t in texts])

    def predict_proba(self, texts):
        probs = []
        for t in texts:
            if "registration fee" in t.lower():
                probs.append([0.08, 0.92])
            else:
                probs.append([0.89, 0.11])
        return np.array(probs)


class DummyLoader:
    def __init__(self, loaded: bool = True) -> None:
        self._loaded = loaded
        self.load_error = None if loaded else "Model missing"
        self._model = DummyModel() if loaded else None

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def model(self):
        if not self._loaded or self._model is None:
            raise ModelLoadError("Model missing")
        return self._model


@pytest.fixture()
def client():
    init_db()
    app = create_app()
    settings = get_settings()
    loader = DummyLoader(loaded=True)
    prediction_service = PredictionService(model_loader=loader, settings=settings)
    app.state.model_loader = loader
    app.state.analysis_service = AnalysisService(
        prediction_service=prediction_service,
        repository=AnalysisRepository(),
        settings=settings,
    )
    app.state.rate_limiter.reset()
    with TestClient(app) as test_client:
        yield test_client


def test_health_and_security_headers(client: TestClient):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
    body = res.json()
    assert body["status"] == "healthy"
    assert body["model_loaded"] is True
    assert body["database_connected"] is True


def test_predict_valid_and_history_crud(client: TestClient):
    payload = {
        "title": "URGENT Remote Data Entry",
        "company_profile": "",
        "description": "Immediate start! A refundable $95 registration fee is required via wire transfer.",
        "requirements": "Laptop and internet access.",
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["prediction"]["predicted_class"] == 1
    assert data["prediction"]["risk_level"] == "HIGH"
    assert any(h["id"] == "upfront-fee" for h in data["heuristics"])

    analysis_id = data["analysis_id"]

    # Retrieve single record
    get_res = client.get(f"/api/v1/history/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["job_title"] == "URGENT Remote Data Entry"

    # Filter & search history
    list_res = client.get("/api/v1/history?search=URGENT&risk_level=HIGH")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Statistics endpoint
    stats_res = client.get("/api/v1/statistics")
    assert stats_res.status_code == 200
    assert stats_res.json()["total_analyzed"] >= 1

    # Delete record
    del_res = client.delete(f"/api/v1/history/{analysis_id}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted_id"] == analysis_id

    # Verify 404 after deletion
    assert client.get(f"/api/v1/history/{analysis_id}").status_code == 404


def test_predict_rejects_empty_short_and_oversized_inputs(client: TestClient):
    # Whitespace-only
    assert (
        client.post(
            "/api/v1/predict",
            json={"title": "   ", "description": "   "},
        ).status_code
        == 422
    )
    # Short description
    assert (
        client.post(
            "/api/v1/predict",
            json={"title": "Engineer", "description": "Too short"},
        ).status_code
        == 422
    )
    # Extremely long description (> 8000 chars)
    assert (
        client.post(
            "/api/v1/predict",
            json={"title": "Engineer", "description": "a" * 8005},
        ).status_code
        == 422
    )


def test_predict_returns_503_when_model_unavailable(client: TestClient):
    settings = get_settings()
    broken_loader = DummyLoader(loaded=False)
    client.app.state.model_loader = broken_loader
    client.app.state.analysis_service = AnalysisService(
        prediction_service=PredictionService(model_loader=broken_loader, settings=settings),
        repository=AnalysisRepository(),
        settings=settings,
    )
    res = client.post(
        "/api/v1/predict",
        json={
            "title": "Software Engineer",
            "description": "Build and maintain Python APIs and PostgreSQL database schemas.",
        },
    )
    assert res.status_code == 503


def test_model_loader_missing_file_raises():
    loader = ModelLoader("models/does_not_exist.pkl")
    with pytest.raises(ModelLoadError):
        loader.load()


def test_rate_limiter_enforces_429(client: TestClient):
    client.app.state.rate_limiter.max_requests = 2
    payload = {
        "title": "Backend Engineer",
        "description": "Build reliable FastAPI microservices and PostgreSQL migrations.",
    }
    assert client.post("/api/v1/predict", json=payload).status_code == 200
    assert client.post("/api/v1/predict", json=payload).status_code == 200
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 429
    assert "Retry-After" in res.headers
