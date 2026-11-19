import re
import tempfile
from pathlib import Path

from fastapi import UploadFile

from app.config import Settings
from app.core.job_info_extractor import extract_job_information
from app.core.pdf_extractor import PageText, PdfProcessingError, extract_pdf_pages
from app.schemas.document_schema import DocumentExtractionResponse


def sanitize_filename(raw_name: str | None) -> str:
    base = Path(raw_name or "uploaded_offer.pdf").name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    return cleaned[:120] or "uploaded_offer.pdf"


class DocumentService:
    """Handles untrusted PDF uploads, temporary file cleanup, and structured extraction."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def process_pdf_upload(self, file: UploadFile) -> DocumentExtractionResponse:
        safe_name = sanitize_filename(file.filename)
        if not safe_name.lower().endswith(".pdf") and file.content_type != "application/pdf":
            raise PdfProcessingError("Only PDF (.pdf) documents are supported.")

        raw_bytes = await file.read()
        file_size = len(raw_bytes)
        if file_size == 0:
            raise PdfProcessingError("The uploaded PDF file is empty (0 bytes).")
        if file_size > self.settings.max_upload_bytes:
            raise PdfProcessingError(
                f"Uploaded PDF exceeds maximum allowed size of {self.settings.max_upload_bytes // (1024 * 1024)} MB."
            )

        tmp_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(raw_bytes)
                tmp_path = Path(tmp.name)

            pdf_out = extract_pdf_pages(tmp_path, self.settings)
        finally:
            if tmp_path and tmp_path.exists():
                tmp_path.unlink(missing_ok=True)

        total_chars = sum(len("".join(p.text.split())) for p in pdf_out.pages)
        info, missing, conflicts, overall_conf = extract_job_information(pdf_out.pages)
        warnings = list(pdf_out.warnings)

        status = "processed" if total_chars >= 30 else "insufficient_text"
        if status == "insufficient_text":
            warnings.append(
                "Very little readable text could be extracted from this PDF. Please review or paste the job text manually."
            )

        preview_source = "\n\n".join(p.text for p in pdf_out.pages if p.text.strip())
        preview = preview_source[:600] + ("..." if len(preview_source) > 600 else "")

        return DocumentExtractionResponse(
            document_status=status,
            filename=safe_name,
            file_size_bytes=file_size,
            page_count=pdf_out.page_count,
            extraction_method=pdf_out.extraction_method,
            extraction_confidence=overall_conf,
            raw_text_preview=preview,
            job_information=info,
            missing_fields=missing,
            conflicting_fields=conflicts,
            warnings=warnings,
        )

    def process_raw_text(self, raw_text: str) -> DocumentExtractionResponse:
        pages = [PageText(page_number=1, text=raw_text.strip(), used_ocr=False)]
        info, missing, conflicts, overall_conf = extract_job_information(pages)
        preview = raw_text.strip()[:600] + ("..." if len(raw_text.strip()) > 600 else "")

        return DocumentExtractionResponse(
            document_status="processed",
            filename="pasted_job_offer.txt",
            file_size_bytes=len(raw_text.encode("utf-8")),
            page_count=1,
            extraction_method="text_paste",
            extraction_confidence=overall_conf,
            raw_text_preview=preview,
            job_information=info,
            missing_fields=missing,
            conflicting_fields=conflicts,
            warnings=[],
        )
