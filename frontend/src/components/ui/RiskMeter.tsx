import React from 'react';
import { DESIGN_TOKENS } from '../../styles/designTokens';
import type { RiskLevel, RiskThresholds } from '../../types/analysis';
import { formatScorePercent } from '../../utils/formatters';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
  thresholds: RiskThresholds;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  level,
  thresholds,
}) => {
  const token = DESIGN_TOKENS.riskStyles[level];
  const percentage = Math.min(100, Math.max(0, Math.round(score * 100)));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-ink-secondary">
          Model Risk Score (uncalibrated)
        </span>
        <span className="font-mono text-sm font-semibold text-ink-primary">
          {score.toFixed(2)} ({formatScorePercent(score)})
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-subtle">
        <div
          className={`h-full transition-all duration-300 ${token.barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-[11px] text-ink-muted">
        <span>0.00</span>
        <span>Medium &ge; {thresholds.mediumMin.toFixed(2)}</span>
        <span>High &ge; {thresholds.highMin.toFixed(2)}</span>
        <span>1.00</span>
      </div>
    </div>
  );
};
