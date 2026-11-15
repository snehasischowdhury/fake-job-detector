import React from 'react';
import { DESIGN_TOKENS } from '../../styles/designTokens';
import type { AnalysisRecord, RiskThresholds } from '../../types/analysis';
import { formatDateTime } from '../../utils/formatters';
import { classifyRiskLevel } from '../../utils/riskThresholds';
import { extractCompanyName } from '../../utils/validation';
import { Badge, RiskBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { RiskMeter } from '../ui/RiskMeter';

interface ResultSummaryCardProps {
  record: AnalysisRecord;
  thresholds: RiskThresholds;
}

export const ResultSummaryCard: React.FC<ResultSummaryCardProps> = ({
  record,
  thresholds,
}) => {
  const riskLevel = classifyRiskLevel(record.mlPrediction.score, thresholds);
  const token = DESIGN_TOKENS.riskStyles[riskLevel];
  const company = extractCompanyName(record.input.companyProfile);
  const isFraudulent = record.mlPrediction.predictedClass === 1;

  return (
    <Card className={isFraudulent ? 'border-crimson/70' : 'border-border-strong'}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={riskLevel} />
            {record.isDemonstration && (
              <Badge variant="demo">Demonstration Output</Badge>
            )}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-ink-primary">
            {record.input.title}
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            {company}
            {record.input.location ? ` · ${record.input.location}` : ''}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
            Model Classification
          </p>
          <p
            className={`mt-1 text-sm font-semibold ${
              isFraudulent ? 'text-red-300' : 'text-emerald-300'
            }`}
          >
            {record.mlPrediction.label} (Class {record.mlPrediction.predictedClass})
          </p>
          <p className="mt-1 font-mono text-xs text-ink-secondary">
            {formatDateTime(record.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <RiskMeter
          score={record.mlPrediction.score}
          level={riskLevel}
          thresholds={thresholds}
        />
        <p className="text-sm text-ink-secondary">{token.description}</p>
      </div>

      <div className="mt-5 grid gap-3 rounded-lg border border-border bg-subtle p-4 text-xs sm:grid-cols-3">
        <div>
          <span className="text-ink-secondary">Pipeline</span>
          <p className="mt-0.5 font-medium text-ink-primary">
            {record.mlPrediction.modelName}
          </p>
        </div>
        <div>
          <span className="text-ink-secondary">Model Version</span>
          <p className="mt-0.5 font-mono font-medium text-ink-primary">
            {record.mlPrediction.modelVersion}
          </p>
        </div>
        <div>
          <span className="text-ink-secondary">Analysis ID</span>
          <p className="mt-0.5 font-mono font-medium text-ink-primary">
            {record.id}
          </p>
        </div>
      </div>
    </Card>
  );
};
