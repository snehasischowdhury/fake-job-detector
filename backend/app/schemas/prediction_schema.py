from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.schemas.job_schema import JobPostingRequest

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]
HeuristicSeverity = Literal["info", "warning", "alert"]


class PredictionPayload(BaseModel):
    label: Literal["Legitimate", "Potentially Fraudulent"]
    predicted_class: Literal[0, 1]
    score: float
    risk_level: RiskLevel


class ModelMetadata(BaseModel):
    name: str
    version: str


class HeuristicIndicatorSchema(BaseModel):
    id: str
    title: str
    severity: HeuristicSeverity
    description: str
    matched_field: str


class PredictionResponse(BaseModel):
    success: bool = True
    analysis_id: str
    created_at: datetime
    prediction: PredictionPayload
    model: ModelMetadata
    heuristics: List[HeuristicIndicatorSchema]
    disclaimer: str


class AnalysisRecordResponse(BaseModel):
    id: str
    created_at: datetime
    job_title: str
    company: str
    input: JobPostingRequest
    prediction: PredictionPayload
    model: ModelMetadata
    heuristics: List[HeuristicIndicatorSchema]
    disclaimer: str


class HistoryListResponse(BaseModel):
    success: bool = True
    total: int
    page: int
    page_size: int
    items: List[AnalysisRecordResponse]


class RiskDistributionItem(BaseModel):
    level: RiskLevel
    count: int


class DailyTrendItem(BaseModel):
    date: str
    legitimate: int
    flagged: int


class StatisticsResponse(BaseModel):
    success: bool = True
    total_analyzed: int
    potentially_fraudulent: int
    legitimate_identified: int
    risk_distribution: List[RiskDistributionItem]
    recent_trend: List[DailyTrendItem]


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded"]
    model_loaded: bool
    database_connected: bool
    model_name: str
    model_version: str
    detail: Optional[str] = None
