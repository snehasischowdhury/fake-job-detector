import re
from typing import Dict, List, Optional, Tuple

from app.core.pdf_extractor import PageText
from app.schemas.document_schema import (
    ExtractedField,
    JobInformationExtracted,
)

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_URL_RE = re.compile(r"\b(?:https?://|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s,;)]*)?\b", re.IGNORECASE)
_SALARY_RE = re.compile(
    r"(?:[$€£₹]|USD|INR|EUR|GBP)\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?[-–to]+\s?(?:[$€£₹]|USD|INR|EUR|GBP)?\s?\d[\d,]*(?:\.\d{1,2})?)?(?:\s*(?:/|per)\s*(?:year|yr|annum|month|mo|week|wk|hour|hr|day)|k\b|LPA\b|CTC\b)?",
    re.IGNORECASE,
)


def _find_labeled_value(
    pages: List[PageText],
    labels: List[str],
    max_len: int = 300,
) -> Tuple[Optional[str], List[int], Optional[str]]:
    """
    Search for explicit 'Label: Value' lines across pages.
    Returns (first_value, source_pages, conflict_note).
    """
    pattern = re.compile(
        rf"^(?:{'|'.join(re.escape(lbl) for lbl in labels)})\s*[:\-–]\s*(.+)$",
        re.IGNORECASE | re.MULTILINE,
    )
    matches: List[Tuple[str, int]] = []
    for p in pages:
        for m in pattern.finditer(p.text):
            val = re.sub(r"\s+", " ", m.group(1)).strip()
            if val and len(val) <= max_len:
                matches.append((val, p.page_number))

    if not matches:
        return None, [], None

    unique_vals: List[str] = []
    page_nums: List[int] = []
    for val, pg in matches:
        if pg not in page_nums:
            page_nums.append(pg)
        if not any(val.lower() == u.lower() for u in unique_vals):
            unique_vals.append(val)

    conflict = None
    if len(unique_vals) > 1:
        conflict = f"Multiple distinct values found: {' | '.join(unique_vals[:3])}"

    return unique_vals[0], page_nums, conflict


def _extract_section(
    pages: List[PageText],
    headings: List[str],
    stop_headings: List[str],
    max_len: int = 3500,
) -> Tuple[Optional[str], List[int]]:
    full_chunks: List[str] = []
    found_pages: List[int] = []

    start_re = re.compile(
        rf"^(?:{'|'.join(re.escape(h) for h in headings)})\s*[:\-–]?\s*$",
        re.IGNORECASE | re.MULTILINE,
    )
    stop_re = re.compile(
        rf"^(?:{'|'.join(re.escape(h) for h in stop_headings)})\s*[:\-–]?\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    for p in pages:
        m = start_re.search(p.text)
        if not m:
            continue
        after = p.text[m.end() :].lstrip("\n\r ")
        stop_m = stop_re.search(after)
        section_text = after[: stop_m.start()] if stop_m else after
        cleaned = re.sub(r"\n{3,}", "\n\n", section_text).strip()
        if cleaned:
            full_chunks.append(cleaned)
            found_pages.append(p.page_number)

    if not full_chunks:
        return None, []
    joined = "\n\n".join(full_chunks)
    if len(joined) > max_len:
        joined = joined[:max_len].rstrip() + "..."
    return joined, found_pages


def _make_field(
    value: Optional[str],
    pages: List[int],
    confidence: float,
    kind: str = "explicit",
    conflict_note: Optional[str] = None,
) -> ExtractedField:
    if not value:
        return ExtractedField(
            value=None,
            confidence=0.0,
            source_pages=[],
            extraction_kind="missing",
            conflict_note=None,
        )
    return ExtractedField(
        value=value,
        confidence=round(confidence, 2),
        source_pages=pages,
        extraction_kind="explicit" if kind == "explicit" else "inferred",
        conflict_note=conflict_note,
    )


def extract_job_information(
    pages: List[PageText],
) -> Tuple[JobInformationExtracted, List[str], List[str], float]:
    """
    Deterministic, local structured extractor mapping page text into JobInformationExtracted.
    Never invents missing values; records source pages, explicit vs. inferred origin,
    and conflicts. Confidence reflects rule-match strength, not probability.
    """
    all_headings = [
        "Job Description",
        "Role Overview",
        "About the Role",
        "Position Summary",
        "Responsibilities",
        "Key Responsibilities",
        "Duties",
        "Requirements",
        "Qualifications",
        "Required Qualifications",
        "Skills",
        "Required Skills",
        "Benefits",
        "Perks & Benefits",
        "Compensation",
        "How to Apply",
        "Application Instructions",
        "Interview Process",
    ]

    # 1. Basic Job Details
    title_val, title_pages, title_conf = _find_labeled_value(
        pages, ["Job Title", "Position", "Role", "Title", "Position Title"], max_len=150
    )
    if title_val:
        job_title = _make_field(title_val, title_pages, 0.94, "explicit", title_conf)
    else:
        # Inferred fallback from first non-empty line of page 1 if short and title-like
        first_line = next(
            (line.strip() for line in pages[0].text.splitlines() if 4 <= len(line.strip()) <= 90),
            None,
        ) if pages else None
        if first_line and not any(
            kw in first_line.lower() for kw in ["dear ", "offer letter", "confidential", "page 1"]
        ):
            job_title = _make_field(first_line, [1], 0.62, "inferred")
        else:
            job_title = _make_field(None, [], 0.0)

    comp_val, comp_pages, comp_conf = _find_labeled_value(
        pages, ["Company", "Company Name", "Organization", "Employer"], max_len=120
    )
    company_name = _make_field(comp_val, comp_pages, 0.92 if comp_val else 0.0, "explicit", comp_conf)

    # Website
    urls_found: List[Tuple[str, int]] = []
    for p in pages:
        for u in _URL_RE.findall(p.text):
            if not any(u.lower() == existing.lower() for existing, _ in urls_found):
                urls_found.append((u, p.page_number))
    company_website = (
        _make_field(urls_found[0][0], [pg for _, pg in urls_found], 0.86, "explicit")
        if urls_found
        else _make_field(None, [], 0.0)
    )

    # Emails
    emails_found: List[Tuple[str, int]] = []
    for p in pages:
        for em in _EMAIL_RE.findall(p.text):
            if not any(em.lower() == existing.lower() for existing, _ in emails_found):
                emails_found.append((em, p.page_number))

    rec_email_val, rec_email_pages, _ = _find_labeled_value(
        pages, ["Recruitment Email", "HR Email", "Apply Email", "Contact Email"], max_len=120
    )
    comp_email_val, comp_email_pages, _ = _find_labeled_value(
        pages, ["Company Email", "Official Email"], max_len=120
    )
    if not rec_email_val and emails_found:
        rec_email_val = emails_found[0][0]
        rec_email_pages = [emails_found[0][1]]
    recruitment_email = _make_field(
        rec_email_val, rec_email_pages, 0.90 if rec_email_val else 0.0, "explicit"
    )
    company_email = _make_field(
        comp_email_val, comp_email_pages, 0.90 if comp_email_val else 0.0, "explicit"
    )

    addr_val, addr_pages, addr_conf = _find_labeled_value(
        pages, ["Company Address", "Office Address", "Address"], max_len=200
    )
    company_address = _make_field(addr_val, addr_pages, 0.88 if addr_val else 0.0, "explicit", addr_conf)

    loc_val, loc_pages, loc_conf = _find_labeled_value(
        pages, ["Location", "Job Location", "Work Location", "City"], max_len=120
    )
    location = _make_field(loc_val, loc_pages, 0.93 if loc_val else 0.0, "explicit", loc_conf)

    dept_val, dept_pages, dept_conf = _find_labeled_value(
        pages, ["Department", "Division", "Team"], max_len=100
    )
    department = _make_field(dept_val, dept_pages, 0.90 if dept_val else 0.0, "explicit", dept_conf)

    ind_val, ind_pages, ind_conf = _find_labeled_value(
        pages, ["Industry", "Sector"], max_len=100
    )
    industry = _make_field(ind_val, ind_pages, 0.90 if ind_val else 0.0, "explicit", ind_conf)

    emp_val, emp_pages, emp_conf = _find_labeled_value(
        pages, ["Employment Type", "Job Type", "Contract Type"], max_len=80
    )
    if not emp_val:
        for p in pages:
            m = re.search(r"\b(Full-time|Part-time|Contract|Temporary|Internship)\b", p.text, re.IGNORECASE)
            if m:
                emp_val = m.group(1)
                emp_pages = [p.page_number]
                break
        employment_type = _make_field(emp_val, emp_pages, 0.72 if emp_val else 0.0, "inferred")
    else:
        employment_type = _make_field(emp_val, emp_pages, 0.92, "explicit", emp_conf)

    mode_val, mode_pages, _ = _find_labeled_value(
        pages, ["Work Mode", "Work Arrangement", "Remote Status"], max_len=80
    )
    if not mode_val:
        for p in pages:
            m = re.search(r"\b(Remote|Hybrid|On-site|Onsite|Work From Home)\b", p.text, re.IGNORECASE)
            if m:
                mode_val = m.group(1)
                mode_pages = [p.page_number]
                break
        work_mode = _make_field(mode_val, mode_pages, 0.74 if mode_val else 0.0, "inferred")
    else:
        work_mode = _make_field(mode_val, mode_pages, 0.92, "explicit")

    # 2. Compensation
    sal_val, sal_pages, sal_conf = _find_labeled_value(
        pages, ["Salary", "Salary Range", "Compensation", "Pay", "Stipend", "CTC"], max_len=100
    )
    if not sal_val:
        sal_matches: List[Tuple[str, int]] = []
        for p in pages:
            for sm in _SALARY_RE.findall(p.text):
                cleaned_sm = sm.strip()
                if cleaned_sm and not any(cleaned_sm == x for x, _ in sal_matches):
                    sal_matches.append((cleaned_sm, p.page_number))
        if sal_matches:
            sal_conflict = (
                f"Multiple compensation figures found: {' | '.join(x for x, _ in sal_matches[:3])}"
                if len(sal_matches) > 1
                else None
            )
            salary_range = _make_field(
                sal_matches[0][0],
                [pg for _, pg in sal_matches],
                0.78,
                "inferred",
                sal_conflict,
            )
        else:
            salary_range = _make_field(None, [], 0.0)
    else:
        salary_range = _make_field(sal_val, sal_pages, 0.93, "explicit", sal_conf)

    curr_val = None
    curr_pages: List[int] = []
    if salary_range.value:
        cm = re.search(r"(\$|€|£|₹|USD|INR|EUR|GBP)", salary_range.value, re.IGNORECASE)
        if cm:
            curr_val = cm.group(1).upper()
            curr_pages = salary_range.source_pages
    currency = _make_field(curr_val, curr_pages, 0.85 if curr_val else 0.0, "inferred")

    freq_val = None
    freq_pages: List[int] = []
    for p in pages:
        fm = re.search(r"\b(per\s+(?:year|annum|month|week|hour|day)|annually|monthly|weekly|hourly)\b", p.text, re.IGNORECASE)
        if fm:
            freq_val = fm.group(1)
            freq_pages = [p.page_number]
            break
    payment_frequency = _make_field(freq_val, freq_pages, 0.78 if freq_val else 0.0, "inferred")

    comm_val, comm_pages, _ = _find_labeled_value(pages, ["Commission"], max_len=120)
    commission = _make_field(comm_val, comm_pages, 0.88 if comm_val else 0.0, "explicit")

    inc_val, inc_pages, _ = _find_labeled_value(pages, ["Incentives", "Bonus"], max_len=150)
    incentives = _make_field(inc_val, inc_pages, 0.88 if inc_val else 0.0, "explicit")

    ben_sec, ben_pages = _extract_section(pages, ["Benefits", "Perks & Benefits"], all_headings, max_len=2000)
    if not ben_sec:
        ben_sec, ben_pages, _ = _find_labeled_value(pages, ["Benefits", "Perks"], max_len=400)
    benefits = _make_field(ben_sec, ben_pages, 0.90 if ben_sec else 0.0, "explicit")

    # 3. Job Requirements
    exp_val, exp_pages, _ = _find_labeled_value(
        pages, ["Required Experience", "Experience"], max_len=120
    )
    if not exp_val:
        for p in pages:
            em = re.search(r"(\d+\+?\s*(?:-\s*\d+\s*)?years?\s+(?:of\s+)?experience)", p.text, re.IGNORECASE)
            if em:
                exp_val = em.group(1)
                exp_pages = [p.page_number]
                break
        required_experience = _make_field(exp_val, exp_pages, 0.76 if exp_val else 0.0, "inferred")
    else:
        required_experience = _make_field(exp_val, exp_pages, 0.91, "explicit")

    edu_val, edu_pages, _ = _find_labeled_value(
        pages, ["Required Education", "Education"], max_len=120
    )
    if not edu_val:
        for p in pages:
            edm = re.search(r"\b(Bachelor'?s(?:\s+Degree)?|Master'?s(?:\s+Degree)?|Ph\.?D\.?|Doctorate|Associate\s+Degree|High\s+School)\b", p.text, re.IGNORECASE)
            if edm:
                edu_val = edm.group(1)
                edu_pages = [p.page_number]
                break
        required_education = _make_field(edu_val, edu_pages, 0.75 if edu_val else 0.0, "inferred")
    else:
        required_education = _make_field(edu_val, edu_pages, 0.90, "explicit")

    skills_sec, skills_pages = _extract_section(pages, ["Skills", "Required Skills"], all_headings, max_len=1500)
    if not skills_sec:
        skills_sec, skills_pages, _ = _find_labeled_value(pages, ["Skills", "Key Skills"], max_len=400)
    skills = _make_field(skills_sec, skills_pages, 0.88 if skills_sec else 0.0, "explicit")

    qual_sec, qual_pages = _extract_section(
        pages, ["Requirements", "Qualifications", "Required Qualifications"], all_headings, max_len=3000
    )
    qualifications = _make_field(qual_sec, qual_pages, 0.90 if qual_sec else 0.0, "explicit")

    resp_sec, resp_pages = _extract_section(
        pages, ["Responsibilities", "Key Responsibilities", "Duties"], all_headings, max_len=3000
    )
    responsibilities = _make_field(resp_sec, resp_pages, 0.90 if resp_sec else 0.0, "explicit")

    desc_sec, desc_pages = _extract_section(
        pages, ["Job Description", "Role Overview", "About the Role", "Position Summary"], all_headings, max_len=5000
    )
    if desc_sec:
        job_description = _make_field(desc_sec, desc_pages, 0.92, "explicit")
    else:
        combined_full = "\n\n".join(p.text for p in pages if p.text.strip()).strip()
        if len(combined_full) >= 30:
            job_description = _make_field(
                combined_full[:5000],
                [p.page_number for p in pages if p.text.strip()],
                0.70,
                "inferred",
            )
        else:
            job_description = _make_field(None, [], 0.0)

    # 4. Recruitment Details
    app_sec, app_pages = _extract_section(
        pages, ["How to Apply", "Application Instructions"], all_headings, max_len=1000
    )
    if not app_sec:
        app_sec, app_pages, _ = _find_labeled_value(pages, ["How to Apply", "Application Instructions"], max_len=300)
    application_instructions = _make_field(app_sec, app_pages, 0.89 if app_sec else 0.0, "explicit")

    contact_val, contact_pages, _ = _find_labeled_value(
        pages, ["Contact", "Contact Information", "Hiring Manager"], max_len=150
    )
    contact_information = _make_field(contact_val, contact_pages, 0.88 if contact_val else 0.0, "explicit")

    int_sec, int_pages = _extract_section(pages, ["Interview Process"], all_headings, max_len=1000)
    if not int_sec:
        int_sec, int_pages, _ = _find_labeled_value(pages, ["Interview Process", "Selection Process"], max_len=250)
    interview_process = _make_field(int_sec, int_pages, 0.88 if int_sec else 0.0, "explicit")

    dead_val, dead_pages, _ = _find_labeled_value(
        pages, ["Application Deadline", "Deadline", "Closing Date"], max_len=80
    )
    application_deadline = _make_field(dead_val, dead_pages, 0.90 if dead_val else 0.0, "explicit")

    # Fee & sensitive info detection
    fee_matches: List[str] = []
    fee_pages: List[int] = []
    for p in pages:
        for fm in re.finditer(r"([^.\n]*(?:registration fee|onboarding fee|training fee|processing fee|refundable deposit|starter kit fee)[^.\n]*)", p.text, re.IGNORECASE):
            fee_matches.append(fm.group(1).strip())
            if p.page_number not in fee_pages:
                fee_pages.append(p.page_number)
    fees_mentioned = _make_field(
        " | ".join(fee_matches[:2]) if fee_matches else None,
        fee_pages,
        0.92 if fee_matches else 0.0,
        "explicit",
    )

    sens_matches: List[str] = []
    sens_pages: List[int] = []
    for p in pages:
        for sm in re.finditer(r"([^.\n]*(?:bank account|personal checking|credit card|ssn|social security|aadhaar|pan card|passport copy|wire transfer|crypto wallet)[^.\n]*)", p.text, re.IGNORECASE):
            sens_matches.append(sm.group(1).strip())
            if p.page_number not in sens_pages:
                sens_pages.append(p.page_number)
    payment_or_personal_info_requests = _make_field(
        " | ".join(sens_matches[:2]) if sens_matches else None,
        sens_pages,
        0.90 if sens_matches else 0.0,
        "explicit",
    )

    info = JobInformationExtracted(
        job_title=job_title,
        company_name=company_name,
        company_website=company_website,
        company_email=company_email,
        company_address=company_address,
        location=location,
        department=department,
        industry=industry,
        employment_type=employment_type,
        work_mode=work_mode,
        salary_range=salary_range,
        currency=currency,
        payment_frequency=payment_frequency,
        commission=commission,
        incentives=incentives,
        benefits=benefits,
        required_experience=required_experience,
        required_education=required_education,
        skills=skills,
        qualifications=qualifications,
        responsibilities=responsibilities,
        job_description=job_description,
        application_instructions=application_instructions,
        contact_information=contact_information,
        recruitment_email=recruitment_email,
        interview_process=interview_process,
        application_deadline=application_deadline,
        fees_mentioned=fees_mentioned,
        payment_or_personal_info_requests=payment_or_personal_info_requests,
    )

    missing_fields: List[str] = []
    conflicting_fields: List[str] = []
    confidences: List[float] = []

    core_check_fields: Dict[str, ExtractedField] = {
        "job_title": info.job_title,
        "company_name": info.company_name,
        "location": info.location,
        "salary_range": info.salary_range,
        "employment_type": info.employment_type,
        "job_description": info.job_description,
        "qualifications": info.qualifications,
        "benefits": info.benefits,
        "recruitment_email": info.recruitment_email,
    }
    for fname, fobj in core_check_fields.items():
        if fobj.value is None:
            missing_fields.append(fname)
        else:
            confidences.append(fobj.confidence)
        if fobj.conflict_note:
            conflicting_fields.append(fname)

    overall_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
    return info, missing_fields, conflicting_fields, overall_conf
