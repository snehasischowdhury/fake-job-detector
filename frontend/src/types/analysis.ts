export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PredictionClass = 0 | 1;

export type SourceType = 'manual' | 'pdf_upload' | 'text_paste';

export type ExtractionMethod = 'pdf_text' | 'ocr' | 'mixed' | 'text_paste';

export interface RiskThresholds {
  /** Scores strictly below mediumMin are LOW RISK */
  mediumMin: number;
  /** Scores >= highMin are HIGH RISK */
  highMin: number;
}

export interface JobPostingInput {
  title: string;
  companyProfile: string;
  location: string;
  department: string;
  salaryRange: string;
  description: string;
  requirements: string;
  benefits: string;
  employmentType: string;
  requiredExperience: string;
  requiredEducation: string;
  industry: string;
  functionArea: string;
}

export interface ExtractedField<T = string> {
  value: T | null;
  /** Heuristic rule-match confidence in [0, 1] (not a statistical probability) */
  confidence: number;
  sourcePages: number[];
  extractionKind: 'explicit' | 'inferred' | 'missing';
  conflictNote?: string | null;
}

export interface JobInformationExtracted {
  // Basic job details
  jobTitle: ExtractedField;
  companyName: ExtractedField;
  companyWebsite: ExtractedField;
  companyEmail: ExtractedField;
  companyAddress: ExtractedField;
  location: ExtractedField;
  department: ExtractedField;
  industry: ExtractedField;
  employmentType: ExtractedField;
  workMode: ExtractedField;
  // Compensation
  salaryRange: ExtractedField;
  currency: ExtractedField;
  paymentFrequency: ExtractedField;
  commission: ExtractedField;
  incentives: ExtractedField;
  benefits: ExtractedField;
  // Job requirements
  requiredExperience: ExtractedField;
  requiredEducation: ExtractedField;
  skills: ExtractedField;
  qualifications: ExtractedField;
  responsibilities: ExtractedField;
  jobDescription: ExtractedField;
  // Recruitment details
  applicationInstructions: ExtractedField;
  contactInformation: ExtractedField;
  recruitmentEmail: ExtractedField;
  interviewProcess: ExtractedField;
  applicationDeadline: ExtractedField;
  feesMentioned: ExtractedField;
  paymentOrPersonalInfoRequests: ExtractedField;
}

export interface DocumentExtractionResponse {
  documentStatus: 'processed' | 'insufficient_text';
  filename: string;
  fileSizeBytes: number;
  pageCount: number;
  extractionMethod: ExtractionMethod;
  extractionConfidence: number;
  rawTextPreview: string;
  jobInformation: JobInformationExtracted;
  missingFields: string[];
  conflictingFields: string[];
  warnings: string[];
}

/**
 * Pure ML output from the TF-IDF + Logistic Regression pipeline.
 * Kept strictly independent from heuristic warnings and UI risk tiers.
 */
export interface MlPredictionOutput {
  label: 'Legitimate' | 'Potentially Fraudulent';
  predictedClass: PredictionClass;
  /** Uncalibrated decision score from predict_proba()[:, 1] in [0, 1] */
  score: number;
  modelName: string;
  modelVersion: string;
}

/**
 * Independent, rule-based warning indicator.
 * Never silently alters mlPrediction.score or mlPrediction.predictedClass.
 */
export interface HeuristicIndicator {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'alert';
  description: string;
  matchedField: keyof JobPostingInput | 'general' | string;
  evidence?: string;
  sourcePages?: number[];
  recommendedAction?: string;
}

export interface DocumentAnalysisMetadata {
  filename?: string;
  extractionMethod?: ExtractionMethod;
  missingFields?: string[];
  companyWebsite?: string | null;
  companyEmail?: string | null;
  recruitmentEmail?: string | null;
}

export interface AnalysisRecord {
  id: string;
  createdAt: string;
  isDemonstration: boolean;
  sourceType?: SourceType;
  documentMeta?: DocumentAnalysisMetadata;
  input: JobPostingInput;
  mlPrediction: MlPredictionOutput;
  heuristics: HeuristicIndicator[];
  disclaimer: string;
}

export interface DashboardStatistics {
  totalAnalyzed: number;
  potentiallyFraudulent: number;
  legitimateIdentified: number;
  riskDistribution: {
    level: RiskLevel;
    count: number;
  }[];
  recentTrend: {
    date: string;
    legitimate: number;
    flagged: number;
  }[];
  isSampleData: boolean;
}

export interface FormValidationErrors {
  title?: string;
  description?: string;
  companyProfile?: string;
  requirements?: string;
  benefits?: string;
}
