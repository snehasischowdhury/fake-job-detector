import numpy as np
import pymupdf
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.core.prediction_service import PredictionService
from app.database.connection import init_db
from app.database.repository import AnalysisRepository
from app.main import create_app
from app.services.analysis_service import AnalysisService


class DummyDocModel:
    def predict(self, texts):
        return np.array([1 if "registration fee" in t.lower() else 0 for t in texts])

    def predict_proba(self, texts):
        return np.array(
            [
                [0.09, 0.91] if "registration fee" in t.lower() else [0.87, 0.13]
                for t in texts
            ]
        )


class DummyDocLoader:
    is_loaded = True
    load_error = None
    model = DummyDocModel()


def _build_pdf_bytes(pages: list[str]) -> bytes:
    doc = pymupdf.open()
    for text in pages:
        page = doc.new_page()
        if text:
            page.insert_text((50, 72), text)
    buf = doc.tobytes()
    doc.close()
    return buf


@pytest.fixture()
def doc_client():
    init_db()
    app = create_app()
    settings = get_settings()
    prediction_service = PredictionService(
        model_loader=DummyDocLoader(), settings=settings
    )
    app.state.model_loader = DummyDocLoader()
    app.state.analysis_service = AnalysisService(
        prediction_service=prediction_service,
        repository=AnalysisRepository(),
        settings=settings,
    )
    app.state.rate_limiter.reset()
    with TestClient(app) as client:
        yield client


def test_extract_valid_multipage_text_pdf(doc_client: TestClient):
    pdf_bytes = _build_pdf_bytes(
        [
            "Job Title: Senior Python Engineer\nCompany: Northstar Systems\nLocation: Kolkata\nSalary: $120,000 - $140,000 per year\nRecruitment Email: careers@northstar.example",
            "Job Description:\nDesign and maintain FastAPI services and PostgreSQL databases.\n\nRequirements:\n3+ years Python experience.\n\nBenefits:\nHealth insurance and 20 days PTO.",
        ]
    )
    res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("offer.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["documentStatus"] == "processed"
    assert body["extractionMethod"] == "pdf_text"
    assert body["pageCount"] == 2
    assert body["jobInformation"]["jobTitle"]["value"] == "Senior Python Engineer"
    assert body["jobInformation"]["companyName"]["value"] == "Northstar Systems"
    assert body["jobInformation"]["location"]["value"] == "Kolkata"
    assert body["jobInformation"]["jobDescription"]["sourcePages"] == [2]


def test_extract_empty_pdf_returns_insufficient_text(doc_client: TestClient):
    pdf_bytes = _build_pdf_bytes([""])
    res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("blank.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 200
    assert res.json()["documentStatus"] == "insufficient_text"


def test_extract_corrupted_pdf_returns_422(doc_client: TestClient):
    res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("broken.pdf", b"not-a-real-pdf", "application/pdf")},
    )
    assert res.status_code == 422


def test_extract_encrypted_pdf_returns_422(doc_client: TestClient):
    raw_pdf = _build_pdf_bytes(["Confidential Job Offer"])
    doc = pymupdf.open(stream=raw_pdf, filetype="pdf")
    enc_bytes = doc.tobytes(
        encryption=pymupdf.PDF_ENCRYPT_AES_256, owner_pw="owner123", user_pw="user123"
    )
    doc.close()

    res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("locked.pdf", enc_bytes, "application/pdf")},
    )
    assert res.status_code == 422


def test_extract_too_many_pages_returns_422(doc_client: TestClient):
    pdf_bytes = _build_pdf_bytes(["Sample text line"] * 26)
    res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("long.pdf", pdf_bytes, "application/pdf")},
    )
    assert res.status_code == 422


def test_extract_and_analyze_reviewed_document_with_heuristics(doc_client: TestClient):
    pdf_bytes = _build_pdf_bytes(
        [
            "Job Title: Remote Clerk\nCompany: Global Apex Corp\nWebsite: https://globalapex.com\nRecruitment Email: hr_recruiter@gmail.com\nJob Description:\nProcess online forms from home. A refundable $95 registration fee is required via wire transfer."
        ]
    )
    ext_res = doc_client.post(
        "/api/v1/documents/extract",
        files={"file": ("scam_offer.pdf", pdf_bytes, "application/pdf")},
    )
    assert ext_res.status_code == 200
    ext = ext_res.json()

    analyze_res = doc_client.post(
        "/api/v1/documents/analyze",
        json={
            "filename": ext["filename"],
            "extractionMethod": ext["extractionMethod"],
            "sourceType": "pdf_upload",
            "missingFields": ext["missingFields"],
            "rawExtracted": ext["jobInformation"],
            "reviewed": ext["jobInformation"],
        },
    )
    assert analyze_res.status_code == 200
    result = analyze_res.json()
    assert result["prediction"]["predicted_class"] in (0, 1)
    assert 0.0 <= result["prediction"]["score"] <= 1.0
    assert result["source_type"] == "pdf_upload"
    assert result["document_meta"]["filename"] == "scam_offer.pdf"
    heuristic_ids = {h["id"] for h in result["heuristics"]}
    assert "upfront-fee" in heuristic_ids
    assert "free-email-domain" in heuristic_ids

    # Verify persisted in history
    hist_res = doc_client.get(f"/api/v1/history/{result['analysis_id']}")
    assert hist_res.status_code == 200
    assert hist_res.json()["source_type"] == "pdf_upload"


def test_analyze_raw_text_endpoint(doc_client: TestClient):
    res = doc_client.post(
        "/api/v1/analyze-text",
        json={
            "text": "Job Title: Backend Engineer\nCompany: Northstar\nJob Description:\nBuild FastAPI microservices, write unit tests, and maintain PostgreSQL schemas."
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["source_type"] == "text_paste"
    assert body["prediction"]["predicted_class"] == 0
