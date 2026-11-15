import html
import re

from app.schemas.job_schema import JobPostingRequest

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")


def clean_text(raw: str) -> str:
    """Decode HTML entities, strip tags, and normalize whitespace."""
    if not raw:
        return ""
    unescaped = html.unescape(raw)
    without_tags = _HTML_TAG_RE.sub(" ", unescaped)
    return _WHITESPACE_RE.sub(" ", without_tags).strip()


def build_model_input_text(job: JobPostingRequest) -> str:
    """
    Construct the single text string passed to the existing scikit-learn Pipeline.
    The pipeline's internal TfidfVectorizer handles tokenization, stop-word removal,
    and 1-2 gram vectorization; we do NOT vectorize independently.
    """
    text_parts = [
        clean_text(job.title),
        clean_text(job.company_profile),
        clean_text(job.description),
        clean_text(job.requirements),
        clean_text(job.benefits),
    ]
    return " ".join(part for part in text_parts if part)


def extract_company_name(company_profile: str) -> str:
    cleaned = clean_text(company_profile)
    if not cleaned:
        return "Unspecified Company"
    first_chunk = re.split(r"[.\n-]", cleaned, maxsplit=1)[0].strip() or cleaned
    return f"{first_chunk[:45]}..." if len(first_chunk) > 48 else first_chunk
