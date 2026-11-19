import re
from typing import List, Optional
from urllib.parse import urlparse

from app.schemas.document_schema import JobInformationExtracted
from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import HeuristicIndicatorSchema

_FREE_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "proton.me",
    "protonmail.com",
    "aol.com",
    "icloud.com",
}


def evaluate_heuristics(
    job: JobPostingRequest,
    extracted_doc: Optional[JobInformationExtracted] = None,
) -> List[HeuristicIndicatorSchema]:
    """
    Independent, transparent rule-based warning indicators.
    Never modifies the ML model's predicted class or raw score.
    """
    indicators: List[HeuristicIndicatorSchema] = []
    combined = " ".join(
        [job.title, job.description, job.requirements, job.benefits]
    ).lower()

    fee_match = re.search(
        r"([^.\n]*(?:registration fee|onboarding fee|training fee|processing fee|refundable deposit|starter kit fee|pay upfront|wire transfer fee)[^.\n]*)",
        combined,
    )
    if fee_match or (extracted_doc and extracted_doc.fees_mentioned.value):
        evidence = (
            extracted_doc.fees_mentioned.value
            if (extracted_doc and extracted_doc.fees_mentioned.value)
            else fee_match.group(1).strip()  # type: ignore[union-attr]
        )
        pages = extracted_doc.fees_mentioned.source_pages if extracted_doc else []
        indicators.append(
            HeuristicIndicatorSchema(
                id="upfront-fee",
                title="Upfront payment or registration/training fee requested",
                severity="alert",
                description="Mentions a fee, deposit, or training payment required from the applicant before employment.",
                matched_field="description",
                evidence=evidence[:180],
                source_pages=pages,
                recommended_action="Legitimate employers do not charge candidates for onboarding, training, or equipment.",
            )
        )

    fin_match = re.search(
        r"([^.\n]*(?:personal checking|personal bank account|forward funds|process payments using your account|crypto wallet|ssn|social security|aadhaar|pan card|passport copy)[^.\n]*)",
        combined,
    )
    if fin_match or (
        extracted_doc and extracted_doc.payment_or_personal_info_requests.value
    ):
        evidence = (
            extracted_doc.payment_or_personal_info_requests.value
            if (
                extracted_doc
                and extracted_doc.payment_or_personal_info_requests.value
            )
            else fin_match.group(1).strip()  # type: ignore[union-attr]
        )
        pages = (
            extracted_doc.payment_or_personal_info_requests.source_pages
            if extracted_doc
            else []
        )
        indicators.append(
            HeuristicIndicatorSchema(
                id="financial-forwarding",
                title="Sensitive banking, ID, or fund-handling request",
                severity="alert",
                description="Requests personal banking credentials, government IDs early in recruitment, or handling client funds.",
                matched_field="description",
                evidence=evidence[:180],
                source_pages=pages,
                recommended_action="Do not share bank details, tax IDs, or process funds before signing a verified contract.",
            )
        )

    contact_match = re.search(
        r"([^.\n]*(?:telegram|whatsapp|signal me|text @|dm @)[^.\n]*)",
        combined,
    )
    if contact_match:
        indicators.append(
            HeuristicIndicatorSchema(
                id="off-platform-contact",
                title="Off-platform messaging contact requested",
                severity="warning",
                description="Directs candidates to encrypted or informal messaging apps instead of a corporate domain.",
                matched_field="description",
                evidence=contact_match.group(1).strip()[:180],
                source_pages=[],
                recommended_action="Request communication through an official corporate email domain.",
            )
        )

    salary_match = re.search(
        r"([^.\n]*(?:guaranteed|no experience needed|instant hire|earn \$\d{1,3},?\d{3}\s*/?\s*week)[^.\n]*)",
        combined,
    )
    if salary_match:
        indicators.append(
            HeuristicIndicatorSchema(
                id="unrealistic-claims",
                title="Urgent or guaranteed-income phrasing",
                severity="warning",
                description="Uses high-pressure urgency or guaranteed weekly earnings claims uncommon in standard hiring.",
                matched_field="title",
                evidence=salary_match.group(1).strip()[:180],
                source_pages=[],
                recommended_action="Compare offered compensation against industry benchmarks for similar roles.",
            )
        )

    if not job.company_profile.strip() and not (
        extracted_doc and extracted_doc.company_name.value
    ):
        indicators.append(
            HeuristicIndicatorSchema(
                id="missing-company-profile",
                title="Missing company details",
                severity="warning",
                description="No verifiable company background or organization name was provided.",
                matched_field="company_profile",
                recommended_action="Verify the employer's legal registration and official website independently.",
            )
        )

    if extracted_doc:
        rec_email = (
            extracted_doc.recruitment_email.value
            or extracted_doc.company_email.value
        )
        if rec_email and "@" in rec_email:
            email_domain = rec_email.split("@", 1)[1].lower().strip()
            if email_domain in _FREE_EMAIL_DOMAINS:
                indicators.append(
                    HeuristicIndicatorSchema(
                        id="free-email-domain",
                        title="Unverified free email domain used for recruitment",
                        severity="warning",
                        description=f"Recruitment contact uses a public webmail domain ({email_domain}) rather than a corporate domain.",
                        matched_field="recruitment_email",
                        evidence=rec_email,
                        source_pages=extracted_doc.recruitment_email.source_pages,
                        recommended_action="Confirm the job posting directly on the company's official careers page.",
                    )
                )
            elif extracted_doc.company_website.value:
                raw_url = extracted_doc.company_website.value
                if not raw_url.startswith(("http://", "https://")):
                    raw_url = f"https://{raw_url}"
                site_host = urlparse(raw_url).netloc.lower().removeprefix("www.")
                if site_host and email_domain != site_host and not email_domain.endswith(f".{site_host}"):
                    indicators.append(
                        HeuristicIndicatorSchema(
                            id="email-domain-mismatch",
                            title="Recruitment email domain differs from company website",
                            severity="warning",
                            description=f"Email domain ({email_domain}) does not match the listed company website ({site_host}).",
                            matched_field="recruitment_email",
                            evidence=f"{rec_email} vs {site_host}",
                            source_pages=extracted_doc.recruitment_email.source_pages,
                            recommended_action="Verify that the sender domain is officially affiliated with the company.",
                        )
                    )

        if extracted_doc.company_name.conflict_note:
            indicators.append(
                HeuristicIndicatorSchema(
                    id="inconsistent-company-name",
                    title="Inconsistent company names in document",
                    severity="warning",
                    description="Multiple distinct organization names were detected across the document.",
                    matched_field="company_name",
                    evidence=extracted_doc.company_name.conflict_note,
                    source_pages=extracted_doc.company_name.source_pages,
                    recommended_action="Clarify the legal employing entity before proceeding.",
                )
            )

    if re.search(r"(commission-only|uncapped commission)", combined):
        indicators.append(
            HeuristicIndicatorSchema(
                id="commission-only",
                title="Commission-only compensation structure",
                severity="info",
                description="Compensation relies partly or wholly on commission; confirm base pay terms in writing.",
                matched_field="description",
                recommended_action="Request written clarification of base salary vs. commission targets.",
            )
        )

    return indicators
