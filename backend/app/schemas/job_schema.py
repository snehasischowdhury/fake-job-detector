from typing import Optional

from pydantic import BaseModel, Field, field_validator


class JobPostingRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    company_profile: str = Field(default="", max_length=3000)
    location: str = Field(default="", max_length=120)
    department: str = Field(default="", max_length=120)
    salary_range: str = Field(default="", max_length=100)
    description: str = Field(..., min_length=30, max_length=8000)
    requirements: str = Field(default="", max_length=4000)
    benefits: str = Field(default="", max_length=2500)
    employment_type: Optional[str] = Field(default="", max_length=80)
    required_experience: Optional[str] = Field(default="", max_length=80)
    required_education: Optional[str] = Field(default="", max_length=80)
    industry: Optional[str] = Field(default="", max_length=120)
    function_area: Optional[str] = Field(default="", max_length=120)

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator(
        "company_profile",
        "location",
        "department",
        "salary_range",
        "requirements",
        "benefits",
        "employment_type",
        "required_experience",
        "required_education",
        "industry",
        "function_area",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> str:
        if value is None:
            return ""
        return value.strip()
