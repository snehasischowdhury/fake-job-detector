import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Trash2 } from 'lucide-react';
import type { AnalysisRecord, RiskThresholds } from '../../types/analysis';
import { formatDateTime, formatScorePercent } from '../../utils/formatters';
import { classifyRiskLevel } from '../../utils/riskThresholds';
import { extractCompanyName } from '../../utils/validation';
import { Badge, RiskBadge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface HistoryTableProps {
  records: AnalysisRecord[];
  thresholds: RiskThresholds;
  onDelete: (id: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  thresholds,
  onDelete,
}) => {
  return (
    <Card padding="none" className="overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-subtle text-xs uppercase tracking-wider text-ink-secondary">
            <tr>
              <th className="px-5 py-3.5 font-medium">Job Title &amp; Company</th>
              <th className="px-5 py-3.5 font-medium">Date</th>
              <th className="px-5 py-3.5 font-medium">Model Label</th>
              <th className="px-5 py-3.5 font-medium">Score / Risk</th>
              <th className="px-5 py-3.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => {
              const level = classifyRiskLevel(record.mlPrediction.score, thresholds);
              return (
                <tr key={record.id} className="hover:bg-subtle/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/results/${record.id}`}
                        className="font-medium text-ink-primary hover:underline"
                      >
                        {record.input.title}
                      </Link>
                      {record.isDemonstration && <Badge variant="demo">Demo</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-secondary">
                      {extractCompanyName(record.input.companyProfile)}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink-secondary whitespace-nowrap">
                    {formatDateTime(record.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-ink-primary">
                    {record.mlPrediction.label}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-ink-primary">
                        {formatScorePercent(record.mlPrediction.score)}
                      </span>
                      <RiskBadge level={level} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/results/${record.id}`}
                        className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink-primary hover:bg-subtle"
                      >
                        Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        aria-label={`Delete analysis for ${record.input.title}`}
                        className="rounded-md p-1.5 text-ink-secondary hover:bg-crimson/20 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-border md:hidden">
        {records.map((record) => {
          const level = classifyRiskLevel(record.mlPrediction.score, thresholds);
          return (
            <div key={record.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/results/${record.id}`}
                    className="text-sm font-semibold text-ink-primary hover:underline"
                  >
                    {record.input.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {extractCompanyName(record.input.companyProfile)}
                  </p>
                </div>
                <RiskBadge level={level} />
              </div>

              <div className="flex items-center justify-between text-xs text-ink-secondary">
                <span>{record.mlPrediction.label}</span>
                <span className="font-mono text-ink-primary">
                  Score: {formatScorePercent(record.mlPrediction.score)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[11px] text-ink-secondary">
                  {formatDateTime(record.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/results/${record.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink-primary"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(record.id)}
                    aria-label={`Delete analysis for ${record.input.title}`}
                    className="rounded-md border border-border p-1.5 text-ink-secondary hover:bg-crimson/20 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
