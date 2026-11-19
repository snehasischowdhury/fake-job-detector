from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

ExtractionMethod = Literal["pdf_text", "ocr", "mixed", "text_paste"]
ExtractionKind = Literal["explicit", "inferred", "missing"]


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ExtractedField(CamelModel):
    value: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_pages: List[int] = Field(default_factory=list)
    extraction_kind: ExtractionKind = "missing"
    conflict_note: Optional[str] = None


class JobInformationExtracted(CamelModel):
    # Basic job details
    job_title: ExtractedField = Field(default_factory=ExtractedField)
    company_name: ExtractedField = Field(default_factory=ExtractedField)
    company_website: ExtractedField = Field(default_factory=ExtractedField)
    company_email: ExtractedField = Field(default_factory=ExtractedField)
    company_address: ExtractedField = Field(default_factory=ExtractedField)
    location: ExtractedField = Field(default_factory=ExtractedField)
    department: ExtractedField = Field(default_factory=ExtractedField)
    industry: ExtractedField = Field(default_factory=ExtractedField)
    employment_type: ExtractedField = Field(default_factory=ExtractedField)
    work_mode: ExtractedField = Field(default_factory=ExtractedField)
    # Compensation
    salary_range: ExtractedField = Field(default_factory=ExtractedField)
    currency: ExtractedField = Field(default_factory=ExtractedField)
    payment_frequency: ExtractedField = Field(default_factory=ExtractedField)
    commission: ExtractedField = Field(default_factory=ExtractedField)
    incentives: ExtractedField = Field(default_factory=ExtractedField)
    benefits: ExtractedField = Field(default_factory=ExtractedField)
    # Job requirements
    required_experience: ExtractedField = Field(default_factory=ExtractedField)
    required_education: ExtractedField = Field(default_factory=ExtractedField)
    skills: ExtractedField = Field(default_factory=ExtractedField)
    qualifications: ExtractedField = Field(default_factory=ExtractedField)
    responsibilities: ExtractedField = Field(default_factory=ExtractedField)
    job_description: ExtractedField = Field(default_factory=ExtractedField)
    # Recruitment details
    application_instructions: ExtractedField = Field(default_factory=ExtractedField)
    contact_information: ExtractedField = Field(default_factory=ExtractedField)
    recruitment_email: ExtractedField = Field(default_factory=ExtractedField)
    interview_process: ExtractedField = Field(default_factory=ExtractedField)
    application_deadline: ExtractedField = Field(default_factory=ExtractedField)
    fees_mentioned: ExtractedField = Field(default_factory=ExtractedField)
    payment_or_personal_info_requests: ExtractedField = Field(
        default_factory=ExtractedField
    )


class DocumentExtractionResponse(CamelModel):
    document_status: Literal["processed", "insufficient_text"]
    filename: str
    file_size_bytes: int
    page_count: int
    extraction_method: ExtractionMethod
    extraction_confidence: float = Field(..., ge=0.0, le=1.0)
    raw_text_preview: str
    job_information: JobInformationExtracted
    missing_fields: List[str] = Field(default_factory=list)
    conflicting_fields: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class DocumentAnalyzeRequest(CamelModel):
    filename: str = Field(default="uploaded_offer.pdf", max_length=150)
    extraction_method: ExtractionMethod = "pdf_text"
    source_type: Literal["pdf_upload", "text_paste"] = "pdf_upload"
    missing_fields: List[str] = Field(default_factory=list)
    raw_extracted: Optional[JobInformationExtracted] = None
    reviewed: JobInformationExtracted


class TextExtractRequest(BaseModel):
    text: str = Field(..., min_length=30, max_length=25000)
