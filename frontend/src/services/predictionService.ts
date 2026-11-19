import type {
  AnalysisRecord,
  DashboardStatistics,
  DocumentExtractionResponse,
  HeuristicIndicator,
  JobInformationExtracted,
  JobPostingInput,
  MlPredictionOutput,
  RiskThresholds,
} from '../types/analysis';
import { classifyRiskLevel } from '../utils/riskThresholds';

/**
 * Contract shared between the Phase 1 Mock service and the live FastAPI HTTP client.
 */
export interface PredictionApiClient {
  readonly isMockMode: boolean;
  analyzeJob(input: JobPostingInput): Promise<AnalysisRecord>;
  extractDocument?(
    file: File,
    onUploadProgress?: (percent: number) => void
  ): Promise<DocumentExtractionResponse>;
  extractRawText?(rawText: string): Promise<DocumentExtractionResponse>;
  analyzeDocument?(
    extraction: DocumentExtractionResponse,
    reviewed: JobInformationExtracted
  ): Promise<AnalysisRecord>;
  fetchHistory?(initialFallback: AnalysisRecord[]): Promise<AnalysisRecord[]>;
  fetchRecordById?(id: string): Promise<AnalysisRecord | undefined>;
  deleteRecord?(id: string): Promise<void>;
  fetchStatistics?(): Promise<DashboardStatistics>;
  computeStatistics(
    records: AnalysisRecord[],
    thresholds: RiskThresholds
  ): DashboardStatistics;
}

/**
 * Independent, transparent heuristic rule engine (local demo mirror).
 * Evaluates explicit text/metadata patterns without modifying the ML score.
 */
export function evaluateHeuristicIndicators(
  input: JobPostingInput
): HeuristicIndicator[] {
  const indicators: HeuristicIndicator[] = [];
  const combinedText = `${input.title} ${input.description} ${input.requirements} ${input.benefits}`.toLowerCase();

  if (
    /(registration fee|onboarding fee|refundable deposit|starter kit fee|pay upfront|wire transfer fee)/.test(
      combinedText
    )
  ) {
    indicators.push({
      id: 'upfront-fee',
      title: 'Upfront payment or registration fee requested',
      severity: 'alert',
      description:
        'The posting mentions a fee, deposit, or payment required from the applicant during onboarding.',
      matchedField: 'description',
    });
  }

  if (
    /(personal checking|personal bank account|forward funds|process payments using your account|crypto wallet)/.test(
      combinedText
    )
  ) {
    indicators.push({
      id: 'financial-forwarding',
      title: 'Unusual payment or fund-handling arrangement',
      severity: 'alert',
      description:
        'Mentions handling client funds, personal bank accounts, or cryptocurrency payouts.',
      matchedField: 'description',
    });
  }

  if (/(telegram|whatsapp|signal me|text @|dm @)/.test(combinedText)) {
    indicators.push({
      id: 'off-platform-contact',
      title: 'Off-platform messaging contact requested',
      severity: 'warning',
      description:
        'Directs candidates to encrypted or informal messaging apps instead of a corporate domain.',
      matchedField: 'description',
    });
  }

  if (/(guaranteed|no experience needed|instant hire|earn \$\d{1,3},?\d{3}\s*\/?\s*week)/.test(combinedText)) {
    indicators.push({
      id: 'unrealistic-claims',
      title: 'Urgent or guaranteed-income phrasing',
      severity: 'warning',
      description:
        'Uses high-pressure urgency or guaranteed weekly earnings claims uncommon in standard hiring.',
      matchedField: 'title',
    });
  }

  if (!input.companyProfile.trim()) {
    indicators.push({
      id: 'missing-company-profile',
      title: 'Missing company profile',
      severity: 'warning',
      description:
        'No company background was provided, making independent employer verification harder.',
      matchedField: 'companyProfile',
    });
  }

  if (/(commission-only|uncapped commission)/.test(combinedText)) {
    indicators.push({
      id: 'commission-only',
      title: 'Commission-only compensation structure',
      severity: 'info',
      description:
        'Compensation relies partly or wholly on commission; confirm base pay terms in writing.',
      matchedField: 'description',
    });
  }

  return indicators;
}

function simulateMlScore(input: JobPostingInput): MlPredictionOutput {
  const textCorpus = `${input.title} ${input.companyProfile} ${input.description} ${input.requirements} ${input.benefits}`.toLowerCase();

  let rawSignal = 0.16;

  const highRiskTerms = [
    'registration fee',
    'telegram',
    'whatsapp',
    'guaranteed',
    'crypto',
    'wire transfer',
    'personal checking',
    'forward funds',
    'instant hire',
    'urgent!!',
    'no experience needed',
  ];
  const moderateTerms = ['commission-only', 'uncapped', 'work from home', 'start today'];
  const legitimateTerms = [
    '401(k)',
    '401k',
    'pull requests',
    'integration tests',
    'collaborate',
    'dental',
    'parental leave',
    'portfolio',
    'postgresql',
    'bachelor',
  ];

  for (const term of highRiskTerms) {
    if (textCorpus.includes(term)) rawSignal += 0.19;
  }
  for (const term of moderateTerms) {
    if (textCorpus.includes(term)) rawSignal += 0.08;
  }
  for (const term of legitimateTerms) {
    if (textCorpus.includes(term)) rawSignal -= 0.04;
  }
  if (!input.companyProfile.trim()) {
    rawSignal += 0.12;
  }

  const clampedScore = Number(Math.min(0.97, Math.max(0.04, rawSignal)).toFixed(2));
  const predictedClass = clampedScore >= 0.5 ? 1 : 0;

  return {
    label: predictedClass === 1 ? 'Potentially Fraudulent' : 'Legitimate',
    predictedClass,
    score: clampedScore,
    modelName: 'TF-IDF + Logistic Regression',
    modelVersion: '1.0-demo',
  };
}

class MockPredictionService implements PredictionApiClient {
  readonly isMockMode = true;

  async analyzeJob(input: JobPostingInput): Promise<AnalysisRecord> {
    await new Promise((resolve) => setTimeout(resolve, 650));

    const mlPrediction = simulateMlScore(input);
    const heuristics = evaluateHeuristicIndicators(input);

    return {
      id: `demo-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      isDemonstration: true,
      sourceType: 'manual',
      input,
      mlPrediction,
      heuristics,
      disclaimer:
        'Demonstration Mode: This score is simulated in the browser. Connect FastAPI for live job_detector.pkl inference.',
    };
  }

  computeStatistics(
    records: AnalysisRecord[],
    thresholds: RiskThresholds
  ): DashboardStatistics {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    let potentiallyFraudulent = 0;
    let legitimateIdentified = 0;

    for (const rec of records) {
      const level = classifyRiskLevel(rec.mlPrediction.score, thresholds);
      counts[level] += 1;
      if (rec.mlPrediction.predictedClass === 1) {
        potentiallyFraudulent += 1;
      } else {
        legitimateIdentified += 1;
      }
    }

    const byDay = new Map<string, { legitimate: number; flagged: number }>();
    for (const rec of records) {
      const dayKey = rec.createdAt.slice(0, 10);
      const current = byDay.get(dayKey) ?? { legitimate: 0, flagged: 0 };
      if (rec.mlPrediction.predictedClass === 1) {
        current.flagged += 1;
      } else {
        current.legitimate += 1;
      }
      byDay.set(dayKey, current);
    }

    const recentTrend = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        ...vals,
      }));

    return {
      totalAnalyzed: records.length,
      potentiallyFraudulent,
      legitimateIdentified,
      riskDistribution: [
        { level: 'LOW', count: counts.LOW },
        { level: 'MEDIUM', count: counts.MEDIUM },
        { level: 'HIGH', count: counts.HIGH },
      ],
      recentTrend,
      isSampleData: records.every((r) => r.isDemonstration),
    };
  }
}

interface BackendPredictionResponse {
  success: boolean;
  analysis_id: string;
  created_at: string;
  source_type?: 'manual' | 'pdf_upload' | 'text_paste';
  document_meta?: {
    filename?: string;
    extraction_method?: 'pdf_text' | 'ocr' | 'mixed' | 'text_paste';
    missing_fields?: string[];
    company_website?: string | null;
    company_email?: string | null;
    recruitment_email?: string | null;
  } | null;
  prediction: {
    label: 'Legitimate' | 'Potentially Fraudulent';
    predicted_class: 0 | 1;
    score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  model: {
    name: string;
    version: string;
  };
  heuristics: {
    id: string;
    title: string;
    severity: 'info' | 'warning' | 'alert';
    description: string;
    matched_field: string;
    evidence?: string;
    source_pages?: number[];
    recommended_action?: string;
  }[];
  disclaimer: string;
}

interface BackendRecordResponse {
  id: string;
  created_at: string;
  source_type?: 'manual' | 'pdf_upload' | 'text_paste';
  document_meta?: BackendPredictionResponse['document_meta'];
  job_title: string;
  company: string;
  input: {
    title: string;
    company_profile: string;
    location: string;
    department: string;
    salary_range: string;
    description: string;
    requirements: string;
    benefits: string;
    employment_type?: string;
    required_experience?: string;
    required_education?: string;
    industry?: string;
    function_area?: string;
  };
  prediction: BackendPredictionResponse['prediction'];
  model: BackendPredictionResponse['model'];
  heuristics: BackendPredictionResponse['heuristics'];
  disclaimer: string;
}

function toBackendPayload(input: JobPostingInput) {
  return {
    title: input.title,
    company_profile: input.companyProfile,
    location: input.location,
    department: input.department,
    salary_range: input.salaryRange,
    description: input.description,
    requirements: input.requirements,
    benefits: input.benefits,
    employment_type: input.employmentType,
    required_experience: input.requiredExperience,
    required_education: input.requiredEducation,
    industry: input.industry,
    function_area: input.functionArea,
  };
}

function mapHeuristics(
  items: BackendPredictionResponse['heuristics']
): HeuristicIndicator[] {
  return items.map((h) => ({
    id: h.id,
    title: h.title,
    severity: h.severity,
    description: h.description,
    matchedField:
      h.matched_field === 'company_profile' ? 'companyProfile' : h.matched_field,
    evidence: h.evidence,
    sourcePages: h.source_pages,
    recommendedAction: h.recommended_action,
  }));
}

function mapDocMeta(meta: BackendPredictionResponse['document_meta']) {
  if (!meta) return undefined;
  return {
    filename: meta.filename,
    extractionMethod: meta.extraction_method,
    missingFields: meta.missing_fields,
    companyWebsite: meta.company_website,
    companyEmail: meta.company_email,
    recruitmentEmail: meta.recruitment_email,
  };
}

function fromBackendRecord(rec: BackendRecordResponse): AnalysisRecord {
  return {
    id: rec.id,
    createdAt: rec.created_at,
    isDemonstration: false,
    sourceType: rec.source_type ?? 'manual',
    documentMeta: mapDocMeta(rec.document_meta),
    input: {
      title: rec.input.title,
      companyProfile: rec.input.company_profile ?? '',
      location: rec.input.location ?? '',
      department: rec.input.department ?? '',
      salaryRange: rec.input.salary_range ?? '',
      description: rec.input.description,
      requirements: rec.input.requirements ?? '',
      benefits: rec.input.benefits ?? '',
      employmentType: rec.input.employment_type ?? '',
      requiredExperience: rec.input.required_experience ?? '',
      requiredEducation: rec.input.required_education ?? '',
      industry: rec.input.industry ?? '',
      functionArea: rec.input.function_area ?? '',
    },
    mlPrediction: {
      label: rec.prediction.label,
      predictedClass: rec.prediction.predicted_class,
      score: rec.prediction.score,
      modelName: rec.model.name,
      modelVersion: rec.model.version,
    },
    heuristics: mapHeuristics(rec.heuristics),
    disclaimer: rec.disclaimer,
  };
}

function reviewedToInput(reviewed: JobInformationExtracted): JobPostingInput {
  return {
    title: reviewed.jobTitle.value || 'Untitled Job Posting',
    companyProfile: [
      reviewed.companyName.value,
      reviewed.companyWebsite.value,
      reviewed.companyAddress.value,
    ]
      .filter(Boolean)
      .join(' — '),
    location: reviewed.location.value ?? '',
    department: reviewed.department.value ?? '',
    salaryRange: reviewed.salaryRange.value ?? '',
    description: [
      reviewed.jobDescription.value,
      reviewed.responsibilities.value,
      reviewed.applicationInstructions.value,
    ]
      .filter(Boolean)
      .join('\n\n'),
    requirements: [
      reviewed.qualifications.value,
      reviewed.skills.value,
      reviewed.requiredExperience.value,
      reviewed.requiredEducation.value,
    ]
      .filter(Boolean)
      .join('\n'),
    benefits: [reviewed.benefits.value, reviewed.incentives.value]
      .filter(Boolean)
      .join('\n'),
    employmentType: reviewed.employmentType.value ?? '',
    requiredExperience: reviewed.requiredExperience.value ?? '',
    requiredEducation: reviewed.requiredEducation.value ?? '',
    industry: reviewed.industry.value ?? '',
    functionArea: '',
  };
}

/**
 * Live FastAPI HTTP Client.
 */
class HttpPredictionService implements PredictionApiClient {
  readonly isMockMode = false;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async analyzeJob(input: JobPostingInput): Promise<AnalysisRecord> {
    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBackendPayload(input)),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const message =
        errBody?.error ||
        errBody?.detail ||
        `Prediction API error (${response.status})`;
      throw new Error(message);
    }

    const data = (await response.json()) as BackendPredictionResponse;
    return {
      id: data.analysis_id,
      createdAt: data.created_at,
      isDemonstration: false,
      sourceType: data.source_type ?? 'manual',
      documentMeta: mapDocMeta(data.document_meta),
      input,
      mlPrediction: {
        label: data.prediction.label,
        predictedClass: data.prediction.predicted_class,
        score: data.prediction.score,
        modelName: data.model.name,
        modelVersion: data.model.version,
      },
      heuristics: mapHeuristics(data.heuristics),
      disclaimer: data.disclaimer,
    };
  }

  extractDocument(
    file: File,
    onUploadProgress?: (percent: number) => void
  ): Promise<DocumentExtractionResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/documents/extract`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onUploadProgress) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        onUploadProgress?.(100);
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed as DocumentExtractionResponse);
          } else {
            reject(
              new Error(
                parsed?.error ||
                  parsed?.detail ||
                  `Document extraction failed (${xhr.status})`
              )
            );
          }
        } catch {
          reject(new Error(`Document extraction failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error while uploading PDF to backend.'));
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  async extractRawText(rawText: string): Promise<DocumentExtractionResponse> {
    const response = await fetch(`${this.baseUrl}/documents/extract-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(
        errBody?.error ||
          errBody?.detail ||
          `Text extraction error (${response.status})`
      );
    }
    return (await response.json()) as DocumentExtractionResponse;
  }

  async analyzeDocument(
    extraction: DocumentExtractionResponse,
    reviewed: JobInformationExtracted
  ): Promise<AnalysisRecord> {
    const sourceType =
      extraction.extractionMethod === 'text_paste' ? 'text_paste' : 'pdf_upload';

    const response = await fetch(`${this.baseUrl}/documents/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: extraction.filename,
        extractionMethod: extraction.extractionMethod,
        sourceType,
        missingFields: extraction.missingFields,
        rawExtracted: extraction.jobInformation,
        reviewed,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      throw new Error(
        errBody?.error ||
          errBody?.detail ||
          `Document analysis error (${response.status})`
      );
    }

    const data = (await response.json()) as BackendPredictionResponse;
    return {
      id: data.analysis_id,
      createdAt: data.created_at,
      isDemonstration: false,
      sourceType: data.source_type ?? sourceType,
      documentMeta: mapDocMeta(data.document_meta),
      input: reviewedToInput(reviewed),
      mlPrediction: {
        label: data.prediction.label,
        predictedClass: data.prediction.predicted_class,
        score: data.prediction.score,
        modelName: data.model.name,
        modelVersion: data.model.version,
      },
      heuristics: mapHeuristics(data.heuristics),
      disclaimer: data.disclaimer,
    };
  }

  async fetchHistory(): Promise<AnalysisRecord[]> {
    const response = await fetch(`${this.baseUrl}/history?page=1&page_size=100`);
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis history (${response.status})`);
    }
    const data = (await response.json()) as { items: BackendRecordResponse[] };
    return data.items.map(fromBackendRecord);
  }

  async fetchRecordById(id: string): Promise<AnalysisRecord | undefined> {
    const response = await fetch(`${this.baseUrl}/history/${encodeURIComponent(id)}`);
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis record (${response.status})`);
    }
    const data = (await response.json()) as BackendRecordResponse;
    return fromBackendRecord(data);
  }

  async deleteRecord(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/history/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete analysis record (${response.status})`);
    }
  }

  computeStatistics(
    records: AnalysisRecord[],
    thresholds: RiskThresholds
  ): DashboardStatistics {
    const stats = new MockPredictionService().computeStatistics(records, thresholds);
    return { ...stats, isSampleData: false };
  }
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const predictionService: PredictionApiClient = USE_MOCK
  ? new MockPredictionService()
  : new HttpPredictionService(API_BASE_URL);
