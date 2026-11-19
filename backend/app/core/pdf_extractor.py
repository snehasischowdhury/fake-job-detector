import io
import logging
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Literal

import pymupdf
from PIL import Image, ImageOps
import pytesseract

from app.config import Settings

logger = logging.getLogger("fake_job_detector")


class PdfProcessingError(ValueError):
    """Raised when an uploaded PDF is invalid, encrypted, oversized, or corrupted."""


@dataclass
class PageText:
    page_number: int  # 1-indexed
    text: str
    used_ocr: bool


@dataclass
class PdfExtractionOutput:
    pages: List[PageText]
    page_count: int
    extraction_method: Literal["pdf_text", "ocr", "mixed"]
    warnings: List[str]


def _run_ocr_on_page(page: pymupdf.Page, dpi: int, timeout_seconds: int) -> str:
    pix = page.get_pixmap(dpi=dpi, alpha=False)
    img_bytes = pix.tobytes("png")
    with Image.open(io.BytesIO(img_bytes)) as img:
        gray = ImageOps.grayscale(img)
        enhanced = ImageOps.autocontrast(gray)
        return pytesseract.image_to_string(
            enhanced, timeout=timeout_seconds
        ).strip()


def extract_pdf_pages(file_path: Path, settings: Settings) -> PdfExtractionOutput:
    """
    Extract text page-by-page using PyMuPDF, activating Tesseract OCR only on pages
    that lack sufficient selectable text and contain images/drawings.
    """
    header = file_path.read_bytes()[:5]
    if header != b"%PDF-":
        raise PdfProcessingError("Uploaded file does not have a valid PDF signature.")

    try:
        doc = pymupdf.open(str(file_path))
    except Exception as exc:
        raise PdfProcessingError("The uploaded PDF appears corrupted or unreadable.") from exc

    try:
        if doc.is_encrypted:
            raise PdfProcessingError(
                "Encrypted or password-protected PDFs are not supported. Please unlock the PDF or paste its text."
            )

        page_count = doc.page_count
        if page_count == 0:
            raise PdfProcessingError("The uploaded PDF contains zero pages.")

        if page_count > settings.max_pdf_pages:
            raise PdfProcessingError(
                f"PDF exceeds the maximum allowed {settings.max_pdf_pages} pages (received {page_count})."
            )

        tesseract_available = shutil.which("tesseract") is not None
        warnings: List[str] = []
        pages: List[PageText] = []
        text_pages = 0
        ocr_pages = 0

        for idx in range(page_count):
            page = doc.load_page(idx)
            raw_text = (page.get_text("text") or "").strip()
            non_ws_len = len("".join(raw_text.split()))

            if non_ws_len >= settings.ocr_min_chars_per_page:
                pages.append(PageText(page_number=idx + 1, text=raw_text, used_ocr=False))
                text_pages += 1
                continue

            has_visuals = bool(page.get_images(full=True) or page.get_drawings())
            if has_visuals:
                if not tesseract_available:
                    warnings.append(
                        f"Page {idx + 1} appears scanned, but Tesseract OCR is not installed on this server."
                    )
                    pages.append(PageText(page_number=idx + 1, text=raw_text, used_ocr=False))
                    if non_ws_len > 0:
                        text_pages += 1
                    continue

                try:
                    ocr_text = _run_ocr_on_page(
                        page,
                        dpi=settings.ocr_dpi,
                        timeout_seconds=settings.ocr_timeout_seconds,
                    )
                    combined = ocr_text if len(ocr_text) > len(raw_text) else raw_text
                    pages.append(PageText(page_number=idx + 1, text=combined, used_ocr=True))
                    if combined:
                        ocr_pages += 1
                except RuntimeError:
                    warnings.append(f"OCR timed out on page {idx + 1}.")
                    pages.append(PageText(page_number=idx + 1, text=raw_text, used_ocr=False))
                except Exception as exc:
                    logger.warning("OCR failed on page %d: %s", idx + 1, exc)
                    warnings.append(f"OCR could not read page {idx + 1}.")
                    pages.append(PageText(page_number=idx + 1, text=raw_text, used_ocr=False))
            else:
                pages.append(PageText(page_number=idx + 1, text=raw_text, used_ocr=False))
                if non_ws_len > 0:
                    text_pages += 1

        if ocr_pages > 0 and text_pages > 0:
            method: Literal["pdf_text", "ocr", "mixed"] = "mixed"
        elif ocr_pages > 0:
            method = "ocr"
        else:
            method = "pdf_text"

        return PdfExtractionOutput(
            pages=pages,
            page_count=page_count,
            extraction_method=method,
            warnings=warnings,
        )
    finally:
        doc.close()
