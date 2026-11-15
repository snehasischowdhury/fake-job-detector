import { describe, expect, it } from 'vitest';
import { EMPTY_JOB_INPUT, SAMPLE_PRESETS } from '../data/mockData';
import {
  evaluateHeuristicIndicators,
  predictionService,
} from '../services/predictionService';
import { validateJobPostingInput } from '../utils/validation';

describe('validation & prediction service', () => {
  it('requires title and minimum description length', () => {
    const errors = validateJobPostingInput(EMPTY_JOB_INPUT);
    expect(errors.title).toBeDefined();
    expect(errors.description).toBeDefined();
  });

  it('accepts valid sample posting without validation errors', () => {
    const errors = validateJobPostingInput(SAMPLE_PRESETS[0].input);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('evaluates heuristic warnings independently of ML score', () => {
    const suspicious = SAMPLE_PRESETS[1].input;
    const heuristics = evaluateHeuristicIndicators(suspicious);
    expect(heuristics.some((h) => h.id === 'upfront-fee')).toBe(true);
    expect(heuristics.some((h) => h.id === 'off-platform-contact')).toBe(true);
  });

  it('computes dashboard statistics deterministically from records', () => {
    const stats = predictionService.computeStatistics([], {
      mediumMin: 0.35,
      highMin: 0.7,
    });
    expect(stats.totalAnalyzed).toBe(0);
    expect(stats.riskDistribution).toHaveLength(3);
  });
});
