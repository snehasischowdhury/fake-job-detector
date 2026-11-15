import type { RiskLevel, RiskThresholds } from '../types/analysis';

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  mediumMin: 0.35,
  highMin: 0.70,
};

/**
 * Maps an uncalibrated model score in [0, 1] to a presentation risk tier.
 * Presentation tiers do NOT alter the underlying ML class or raw score.
 */
export function classifyRiskLevel(
  score: number,
  thresholds: RiskThresholds = DEFAULT_RISK_THRESHOLDS
): RiskLevel {
  if (score >= thresholds.highMin) return 'HIGH';
  if (score >= thresholds.mediumMin) return 'MEDIUM';
  return 'LOW';
}

export function validateThresholds(thresholds: RiskThresholds): string | null {
  if (thresholds.mediumMin <= 0 || thresholds.mediumMin >= 1) {
    return 'Medium threshold must be between 0.01 and 0.99.';
  }
  if (thresholds.highMin <= thresholds.mediumMin || thresholds.highMin >= 1) {
    return 'High threshold must be greater than Medium threshold and below 1.00.';
  }
  return null;
}
