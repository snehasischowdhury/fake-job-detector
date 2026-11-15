import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { AnalysisRecord, RiskThresholds } from '../../types/analysis';
import { formatScorePercent, formatShortDate } from '../../utils/formatters';
import { classifyRiskLevel } from '../../utils/riskThresholds';
import { extractCompanyName } from '../../utils/validation';
import { RiskBadge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface RecentAnalysesListProps {
  records: AnalysisRecord[];
  thresholds: RiskThresholds;
}

export const RecentAnalysesList: React.FC<RecentAnalysesListProps> = ({
  records,
  thresholds,
}) => {
  const recent = records.slice(0, 5);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">
            Recent Analyses
          </h3>
          <p className="mt-0.5 text-xs text-ink-secondary">
            Latest job postings evaluated in this session.
          </p>
        </div>
        <Link
          to="/history"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-primary hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="divide-y divide-border">
        {recent.map((item) => {
          const level = classifyRiskLevel(item.mlPrediction.score, thresholds);
          return (
            <li key={item.id}>
              <Link
                to={`/results/${item.id}`}
                className="flex flex-col gap-2 py-3.5 hover:bg-subtle/40 -mx-2 px-2 rounded-lg transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">
                    {item.input.title}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {extractCompanyName(item.input.companyProfile)} ·{' '}
                    {formatShortDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-ink-secondary">
                    {formatScorePercent(item.mlPrediction.score)}
                  </span>
                  <RiskBadge level={level} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
