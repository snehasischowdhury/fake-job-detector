export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PredictionClass = 0 | 1;

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
  matchedField: keyof JobPostingInput | 'general';
}

export interface AnalysisRecord {
  id: string;
  createdAt: string;
  isDemonstration: boolean;
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
