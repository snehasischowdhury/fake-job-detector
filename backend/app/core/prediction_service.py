from typing import Tuple

from app.config import Settings
from app.core.model_loader import ModelLoader
from app.core.preprocessing import build_model_input_text
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import PredictionPayload, RiskLevel

DISCLAIMER_TEXT = (
    "This is an automated screening assessment, not definitive proof of fraud. "
    "The score is an uncalibrated Logistic Regression output (class_weight='balanced')."
)


def classify_risk_level(
    score: float, medium_min: float, high_min: float
) -> RiskLevel:
    if score >= high_min:
        return "HIGH"
    if score >= medium_min:
        return "MEDIUM"
    return "LOW"


class PredictionService:
    """Runs inference on the pre-loaded scikit-learn pipeline."""

    def __init__(self, model_loader: ModelLoader, settings: Settings) -> None:
        self.model_loader = model_loader
        self.settings = settings

    def predict(self, job: JobPostingRequest) -> Tuple[PredictionPayload, str]:
        model = self.model_loader.model
        text_input = build_model_input_text(job)

        if not text_input:
            raise ValueError("Job posting contains no analyzable text after preprocessing.")

        predicted_class = int(model.predict([text_input])[0])
        probabilities = model.predict_proba([text_input])[0]

        # Class 1 corresponds to fraudulent postings
        fraud_score = round(float(probabilities[1]), 4)
        label = "Potentially Fraudulent" if predicted_class == 1 else "Legitimate"
        risk_level = classify_risk_level(
            fraud_score,
            self.settings.risk_medium_min,
            self.settings.risk_high_min,
        )

        payload = PredictionPayload(
            label=label,
            predicted_class=1 if predicted_class == 1 else 0,
            score=fraud_score,
            risk_level=risk_level,
        )
        return payload, text_input
