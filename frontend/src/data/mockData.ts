import type { AnalysisRecord, JobPostingInput } from '../types/analysis';

export const EMPTY_JOB_INPUT: JobPostingInput = {
  title: '',
  companyProfile: '',
  location: '',
  department: '',
  salaryRange: '',
  description: '',
  requirements: '',
  benefits: '',
  employmentType: '',
  requiredExperience: '',
  requiredEducation: '',
  industry: '',
  functionArea: '',
};

export const SAMPLE_PRESETS: {
  id: string;
  label: string;
  tag: string;
  input: JobPostingInput;
}[] = [
  {
    id: 'legit-swe',
    label: 'Legitimate Backend Engineer',
    tag: 'Low Risk Sample',
    input: {
      title: 'Backend Software Engineer (Python / FastAPI)',
      companyProfile:
        'Northstar Ledger Systems builds reconciliation infrastructure for mid-market accounting teams. Founded in 2019 with offices in Austin and Toronto.',
      location: 'Austin, TX (Hybrid)',
      department: 'Platform Engineering',
      salaryRange: '$130,000 - $155,000',
      description:
        'We are looking for a Backend Software Engineer to design, build, and maintain API services powering our automated financial ledger pipeline. You will collaborate with product engineers, write unit and integration tests in Pytest, review pull requests, and participate in an equitable on-call rotation.',
      requirements:
        '3+ years of production Python experience, familiarity with FastAPI or Django, solid understanding of PostgreSQL indexing and migrations, and experience with CI/CD workflows.',
      benefits:
        'Comprehensive health, dental, and vision insurance, 401(k) matching up to 4%, 20 days PTO, and annual learning stipend.',
      employmentType: 'Full-time',
      requiredExperience: 'Mid-Senior level',
      requiredEducation: "Bachelor's Degree",
      industry: 'Computer Software',
      functionArea: 'Engineering',
    },
  },
  {
    id: 'suspicious-data-entry',
    label: 'Suspicious Remote Data Entry',
    tag: 'High Risk Sample',
    input: {
      title: 'URGENT!! Remote Data Entry Clerk - Earn $4,500 Weekly Guaranteed',
      companyProfile: '',
      location: 'Work From Home / Anywhere',
      department: '',
      salaryRange: '$4,500 / week',
      description:
        'Immediate start! No experience needed. We are hiring motivated individuals to process simple online forms from home. Guaranteed weekly payout via wire transfer or crypto wallet. To activate your onboarding portal and receive your starter laptop, a refundable $95 registration fee is required. Contact our hiring manager directly on Telegram @hr_fast_onboarding or WhatsApp.',
      requirements:
        'Must have smartphone or laptop, valid bank account for direct deposit verification, and willingness to start today.',
      benefits: 'Weekly instant cash bonus, flexible 2-hour daily schedule.',
      employmentType: 'Part-time',
      requiredExperience: 'Entry level',
      requiredEducation: 'Unspecified',
      industry: 'Administrative',
      functionArea: 'Administrative',
    },
  },
  {
    id: 'borderline-sales',
    label: 'Borderline Commission Sales Role',
    tag: 'Medium Risk Sample',
    input: {
      title: 'Remote Client Acquisition Representative',
      companyProfile: 'Apex Growth Partners — fast-growing digital outreach agency.',
      location: 'Remote, US',
      department: 'Sales',
      salaryRange: '$80,000 - $180,000 OTE',
      description:
        'Seeking driven self-starters to contact inbound leads and close B2B service packages. Uncapped commission structure with rapid advancement opportunities. Training provided during the first two weeks; initial compensation is commission-only until quota targets are met.',
      requirements:
        'Strong verbal communication, self-motivated attitude, reliable internet connection.',
      benefits: 'Uncapped commission, flexible hours.',
      employmentType: 'Contract',
      requiredExperience: 'Associate',
      requiredEducation: 'High School or equivalent',
      industry: 'Marketing and Advertising',
      functionArea: 'Sales',
    },
  },
];

export const INITIAL_DEMO_HISTORY: AnalysisRecord[] = [
  {
    id: 'demo-1001',
    createdAt: '2026-11-14T09:15:00.000Z',
    isDemonstration: true,
    input: SAMPLE_PRESETS[1].input,
    mlPrediction: {
      label: 'Potentially Fraudulent',
      predictedClass: 1,
      score: 0.91,
      modelName: 'TF-IDF + Logistic Regression',
      modelVersion: '1.0-demo',
    },
    heuristics: [
      {
        id: 'upfront-fee',
        title: 'Upfront payment or registration fee requested',
        severity: 'alert',
        description: 'Mentions a refundable registration fee or onboarding deposit.',
        matchedField: 'description',
      },
      {
        id: 'off-platform-contact',
        title: 'Off-platform messaging contact requested',
        severity: 'warning',
        description: 'Directs applicants to Telegram or WhatsApp instead of an official recruiting channel.',
        matchedField: 'description',
      },
      {
        id: 'missing-company-profile',
        title: 'Missing company profile',
        severity: 'warning',
        description: 'No verifiable company background or organization details were provided.',
        matchedField: 'companyProfile',
      },
    ],
    disclaimer:
      'Demonstration output: generated by the Phase 1 mock predictor, not the live scikit-learn model.',
  },
  {
    id: 'demo-1002',
    createdAt: '2026-11-13T16:40:00.000Z',
    isDemonstration: true,
    input: SAMPLE_PRESETS[0].input,
    mlPrediction: {
      label: 'Legitimate',
      predictedClass: 0,
      score: 0.14,
      modelName: 'TF-IDF + Logistic Regression',
      modelVersion: '1.0-demo',
    },
    heuristics: [],
    disclaimer:
      'Demonstration output: generated by the Phase 1 mock predictor, not the live scikit-learn model.',
  },
  {
    id: 'demo-1003',
    createdAt: '2026-11-12T11:20:00.000Z',
    isDemonstration: true,
    input: SAMPLE_PRESETS[2].input,
    mlPrediction: {
      label: 'Legitimate',
      predictedClass: 0,
      score: 0.48,
      modelName: 'TF-IDF + Logistic Regression',
      modelVersion: '1.0-demo',
    },
    heuristics: [
      {
        id: 'commission-only',
        title: 'Commission-only or wide OTE compensation range',
        severity: 'info',
        description: 'Describes commission-only initial pay or wide earnings range.',
        matchedField: 'description',
      },
    ],
    disclaimer:
      'Demonstration output: generated by the Phase 1 mock predictor, not the live scikit-learn model.',
  },
  {
    id: 'demo-1004',
    createdAt: '2026-11-11T14:05:00.000Z',
    isDemonstration: true,
    input: {
      ...EMPTY_JOB_INPUT,
      title: 'Senior Product Designer',
      companyProfile: 'Verve Health Analytics develops clinical scheduling software for regional hospitals.',
      location: 'Boston, MA',
      department: 'Design',
      salaryRange: '$135,000 - $150,000',
      description:
        'Lead end-to-end UX research, wireframing, and design systems across our clinician scheduling suite. Partner closely with engineering and clinical operations.',
      requirements: '5+ years in B2B SaaS product design, Figma proficiency, portfolio required.',
      benefits: 'Medical/dental/vision, 401k match, parental leave.',
      employmentType: 'Full-time',
      requiredExperience: 'Mid-Senior level',
      requiredEducation: "Bachelor's Degree",
      industry: 'Hospital & Health Care',
      functionArea: 'Design',
    },
    mlPrediction: {
      label: 'Legitimate',
      predictedClass: 0,
      score: 0.11,
      modelName: 'TF-IDF + Logistic Regression',
      modelVersion: '1.0-demo',
    },
    heuristics: [],
    disclaimer:
      'Demonstration output: generated by the Phase 1 mock predictor, not the live scikit-learn model.',
  },
  {
    id: 'demo-1005',
    createdAt: '2026-11-10T08:50:00.000Z',
    isDemonstration: true,
    input: {
      ...EMPTY_JOB_INPUT,
      title: 'Payroll Processing Assistant - Instant Hire',
      companyProfile: '',
      location: 'Remote',
      salaryRange: '$3,200/wk',
      description:
        'Receive and forward client funds using your personal checking account while our regional office completes setup. Earn a 10% commission on every processed transfer. Reply via WhatsApp for immediate placement.',
      requirements: 'Active checking account, US resident.',
      employmentType: 'Full-time',
    },
    mlPrediction: {
      label: 'Potentially Fraudulent',
      predictedClass: 1,
      score: 0.88,
      modelName: 'TF-IDF + Logistic Regression',
      modelVersion: '1.0-demo',
    },
    heuristics: [
      {
        id: 'bank-transfer-mule',
        title: 'Requests personal bank account for fund forwarding',
        severity: 'alert',
        description: 'Asking applicants to receive or forward funds via personal accounts is a common scam pattern.',
        matchedField: 'description',
      },
      {
        id: 'off-platform-contact',
        title: 'Off-platform messaging contact requested',
        severity: 'warning',
        description: 'Directs applicants to WhatsApp instead of an official recruiting channel.',
        matchedField: 'description',
      },
      {
        id: 'missing-company-profile',
        title: 'Missing company profile',
        severity: 'warning',
        description: 'No verifiable company background or organization details were provided.',
        matchedField: 'companyProfile',
      },
    ],
    disclaimer:
      'Demonstration output: generated by the Phase 1 mock predictor, not the live scikit-learn model.',
  },
];
