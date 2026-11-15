import re
from typing import List

from app.schemas.job_schema import JobPostingRequest
from app.schemas.prediction_schema import HeuristicIndicatorSchema


def evaluate_heuristics(job: JobPostingRequest) -> List[HeuristicIndicatorSchema]:
    """
    Independent, transparent rule-based warning indicators.
    Never modifies the ML model's predicted class or raw score.
    """
    indicators: List[HeuristicIndicatorSchema] = []
    combined = " ".join(
        [job.title, job.description, job.requirements, job.benefits]
    ).lower()

    if re.search(
        r"(registration fee|onboarding fee|refundable deposit|starter kit fee|pay upfront|wire transfer fee)",
        combined,
    ):
        indicators.append(
            HeuristicIndicatorSchema(
                id="upfront-fee",
                title="Upfront payment or registration fee requested",
                severity="alert",
                description="The posting mentions a fee, deposit, or payment required from the applicant during onboarding.",
                matched_field="description",
            )
        )

    if re.search(
        r"(personal checking|personal bank account|forward funds|process payments using your account|crypto wallet)",
        combined,
    ):
        indicators.append(
            HeuristicIndicatorSchema(
                id="financial-forwarding",
                title="Unusual payment or fund-handling arrangement",
                severity="alert",
                description="Mentions handling client funds, personal bank accounts, or cryptocurrency payouts.",
                matched_field="description",
            )
        )

    if re.search(r"(telegram|whatsapp|signal me|text @|dm @)", combined):
        indicators.append(
            HeuristicIndicatorSchema(
                id="off-platform-contact",
                title="Off-platform messaging contact requested",
                severity="warning",
                description="Directs candidates to encrypted or informal messaging apps instead of a corporate domain.",
                matched_field="description",
            )
        )

    if re.search(
        r"(guaranteed|no experience needed|instant hire|earn \$\d{1,3},?\d{3}\s*/?\s*week)",
        combined,
    ):
        indicators.append(
            HeuristicIndicatorSchema(
                id="unrealistic-claims",
                title="Urgent or guaranteed-income phrasing",
                severity="warning",
                description="Uses high-pressure urgency or guaranteed weekly earnings claims uncommon in standard hiring.",
                matched_field="title",
            )
        )

    if not job.company_profile.strip():
        indicators.append(
            HeuristicIndicatorSchema(
                id="missing-company-profile",
                title="Missing company profile",
                severity="warning",
                description="No company background was provided, making independent employer verification harder.",
                matched_field="company_profile",
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
            )
        )

    return indicators
