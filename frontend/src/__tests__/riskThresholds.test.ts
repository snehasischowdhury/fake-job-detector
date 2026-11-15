import { describe, expect, it } from 'vitest';
import {
  classifyRiskLevel,
  DEFAULT_RISK_THRESHOLDS,
  validateThresholds,
} from '../utils/riskThresholds';

describe('riskThresholds', () => {
  it('classifies scores into LOW, MEDIUM, and HIGH tiers using defaults', () => {
    expect(classifyRiskLevel(0.14)).toBe('LOW');
    expect(classifyRiskLevel(0.35)).toBe('MEDIUM');
    expect(classifyRiskLevel(0.69)).toBe('MEDIUM');
    expect(classifyRiskLevel(0.70)).toBe('HIGH');
  });

  it('supports custom configurable thresholds', () => {
    const custom = { mediumMin: 0.25, highMin: 0.80 };
    expect(classifyRiskLevel(0.30, custom)).toBe('MEDIUM');
    expect(classifyRiskLevel(0.75, custom)).toBe('MEDIUM');
    expect(classifyRiskLevel(0.82, custom)).toBe('HIGH');
  });

  it('validates threshold ordering and bounds', () => {
    expect(validateThresholds(DEFAULT_RISK_THRESHOLDS)).toBeNull();
    expect(validateThresholds({ mediumMin: 0.7, highMin: 0.5 })).not.toBeNull();
    expect(validateThresholds({ mediumMin: 0, highMin: 0.5 })).not.toBeNull();
  });
});
